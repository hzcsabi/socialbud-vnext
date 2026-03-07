"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import type { MemberRole } from "./shared";

/**
 * Soft-delete an account (admin only). Sets accounts.deleted_at. Data preserved for analytics.
 */
export async function deleteAccountAsAdmin(
  accountId: string,
  accountName: string | null
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("accounts")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", accountId);
  if (error) {
    const msg = error.message;
    if (msg?.includes("deleted_at") || msg?.includes("column"))
      return { error: `${msg} Run the migration to add deleted_at (e.g. ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL).` };
    return { error: msg };
  }
  revalidatePath("/admin/users");
  return {};
}

/**
 * Rename an account (admin only).
 */
export async function renameAccountAsAdmin(
  accountId: string,
  newName: string
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) return { error: error.message };
  return {};
}

/**
 * Set an account's parent (admin only). Pass null to make top-level.
 * Rejects if new parent would create a cycle (self or descendant).
 */
export async function setAccountParentAsAdmin(
  accountId: string,
  newParentAccountId: string | null
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  if (newParentAccountId === accountId) return { error: "Account cannot be its own parent" };

  const supabase = createServiceRoleClient();

  if (newParentAccountId !== null) {
    const { data: children } = await supabase
      .from("accounts")
      .select("id")
      .eq("parent_account_id", accountId)
      .limit(1);
    if (children && children.length > 0) {
      return { error: "Parent accounts must stay top-level and cannot be assigned under another account." };
    }
  }

  if (newParentAccountId !== null) {
    const { data: target } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", newParentAccountId)
      .maybeSingle();
    if (!target) return { error: "Parent account not found" };

    const descendantIds = new Set<string>();
    let current = [accountId];
    while (current.length > 0) {
      const { data: children } = await supabase
        .from("accounts")
        .select("id")
        .in("parent_account_id", current);
      current = (children ?? []).map((c) => c.id).filter((id) => !descendantIds.has(id));
      current.forEach((id) => descendantIds.add(id));
    }
    if (descendantIds.has(newParentAccountId)) return { error: "Cannot set parent to a descendant (would create a cycle)" };
  }

  const { error } = await supabase
    .from("accounts")
    .update({ parent_account_id: newParentAccountId, updated_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) return { error: error.message };
  return {};
}

/**
 * Move a member from one account to another (admin only). Preserves role.
 * Fails if user is not in source account or already in target account.
 */
export async function moveMemberAsAdmin(
  userId: string,
  fromAccountId: string,
  toAccountId: string
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  if (fromAccountId === toAccountId) return { error: "Source and target account are the same" };

  const supabase = createServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from("account_members")
    .select("id, role")
    .eq("account_id", fromAccountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "User is not a member of the source account" };

  const { data: alreadyInTarget } = await supabase
    .from("account_members")
    .select("id")
    .eq("account_id", toAccountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (alreadyInTarget) return { error: "User is already a member of the target account" };

  const { error: delError } = await supabase
    .from("account_members")
    .delete()
    .eq("account_id", fromAccountId)
    .eq("user_id", userId);
  if (delError) return { error: delError.message };

  const { error: insertError } = await supabase.from("account_members").insert({
    account_id: toAccountId,
    user_id: userId,
    role: existing.role,
  });
  if (insertError) return { error: insertError.message };
  return {};
}

/**
 * Set a member's role in an account (admin only). Role must be owner, manager, or member.
 * Ensures the account always has exactly one owner: demoting the only owner is rejected;
 * promoting someone to owner demotes any existing owner(s) to manager.
 */
export async function setAccountMemberRoleAsAdmin(
  accountId: string,
  userId: string,
  newRole: MemberRole
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const supabase = createServiceRoleClient();

  const { data: currentMember, error: fetchMemberError } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchMemberError) return { error: fetchMemberError.message };
  if (!currentMember) return { error: "User is not a member of this account" };

  if (newRole === "owner") {
    const { data: currentOwners, error: ownersError } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner");
    if (ownersError) return { error: ownersError.message };
    const ownerUserIds = (currentOwners ?? []).map((r) => r.user_id).filter((id) => id !== userId);
    for (const ownerId of ownerUserIds) {
      const { error: demoteError } = await supabase
        .from("account_members")
        .update({ role: "manager" })
        .eq("account_id", accountId)
        .eq("user_id", ownerId);
      if (demoteError) return { error: demoteError.message };
    }
    const { error: promoteError } = await supabase
      .from("account_members")
      .update({ role: "owner" })
      .eq("account_id", accountId)
      .eq("user_id", userId);
    if (promoteError) return { error: promoteError.message };
    return {};
  }

  if (currentMember.role === "owner") {
    const { data: owners, error: countError } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner");
    if (countError) return { error: countError.message };
    if ((owners ?? []).length <= 1) {
      return {
        error:
          "Account must have an owner. Promote another member to owner first, then you can change this member's role.",
      };
    }
  }

  const { error } = await supabase
    .from("account_members")
    .update({ role: newRole })
    .eq("account_id", accountId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return {};
}

/**
 * Add a user as a member of an account (admin only). If role is owner, any existing owner is demoted to manager.
 * Fails if user is already a member of the account.
 */
export async function addMemberToAccountAsAdmin(
  accountId: string,
  userId: string,
  role: MemberRole
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("account_members")
    .select("id")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { error: "User is already a member of this account" };

  if (role === "owner") {
    const { data: currentOwners, error: ownersError } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner");
    if (ownersError) return { error: ownersError.message };
    for (const row of currentOwners ?? []) {
      const { error: demoteError } = await supabase
        .from("account_members")
        .update({ role: "manager" })
        .eq("account_id", accountId)
        .eq("user_id", row.user_id);
      if (demoteError) return { error: demoteError.message };
    }
  }

  const { error: insertError } = await supabase.from("account_members").insert({
    account_id: accountId,
    user_id: userId,
    role,
  });
  if (insertError) return { error: insertError.message };
  return {};
}

/**
 * Remove a user from an account (admin only). Fails if the user is the only owner (account must have an owner).
 */
export async function removeMemberFromAccountAsAdmin(
  accountId: string,
  userId: string
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const supabase = createServiceRoleClient();

  const { data: member, error: fetchError } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!member) return { error: "User is not a member of this account" };

  if (member.role === "owner") {
    const { data: owners, error: countError } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner");
    if (countError) return { error: countError.message };
    if ((owners ?? []).length <= 1) {
      return {
        error:
          "Account must have an owner. Set another member as owner before removing this user.",
      };
    }
  }

  const { error } = await supabase
    .from("account_members")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return {};
}
