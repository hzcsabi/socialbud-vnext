"use server";

import { getAdminUser } from "@/lib/admin";
import { sendAccountDeletedEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export type UserAccountEntry = {
  accountId: string;
  accountName: string;
  role: string;
  memberCount: number;
  parentAccountName: string | null;
  hasSubaccounts: boolean;
};

export type UserListEntry = {
  id: string;
  email: string | null;
  name: string | null;
  website: string | null;
  status: UserStatus;
  createdAt: string;
  accounts: UserAccountEntry[];
};

export type UserStatus = "active" | "pending" | "banned" | "suspended";

export type AccountMemberEntry = {
  userId: string;
  email: string;
  name: string | null;
  status: UserStatus;
};

export type AccountListEntry = {
  id: string;
  name: string;
  parent_account_id: string | null;
  parentAccountName: string | null;
  memberCount: number;
  hasSubaccounts: boolean;
  /** Number of direct sub-accounts (parent_account_id = this account). */
  subaccountCount: number;
  memberEmails: string[];
  members: AccountMemberEntry[];
  /** Subscription status (e.g. active, canceled). Null if no subscription. */
  subscriptionStatus: string | null;
  /** Plan name (active or last used if canceled). Null if none. */
  plan: string | null;
  /** Who is responsible for payment: account name or "Self" when the account pays for itself. */
  billingResponsible: string | null;
};

export async function listUsersForAdmin(): Promise<{
  users: UserListEntry[];
  error?: string;
}> {
  const admin = await getAdminUser();
  if (!admin) return { users: [], error: "Unauthorized" };
  try {
    const supabase = createServiceRoleClient();
    const {
      data: { users: authUsers },
      error: listError,
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { users: [], error: listError.message };
    if (!authUsers?.length) return { users: [] };

    const userIds = authUsers.map((u) => u.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, website")
      .in("user_id", userIds);

    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const { data: allAccounts } = await supabase
      .from("accounts")
      .select("id, name, parent_account_id");

    const accountById = new Map(
      (allAccounts ?? []).map((a) => [
        a.id,
        {
          id: a.id,
          name: a.name ?? "",
          parent_account_id: a.parent_account_id ?? null,
        },
      ])
    );

    const parentAccountNameByAccountId = new Map<string, string>();
    const hasSubaccountsByAccountId = new Map<string, boolean>();
    for (const a of allAccounts ?? []) {
      if (a.parent_account_id) {
        const parent = accountById.get(a.parent_account_id);
        parentAccountNameByAccountId.set(a.id, parent?.name ?? "");
      }
      const children = (allAccounts ?? []).filter(
        (x) => x.parent_account_id === a.id
      );
      hasSubaccountsByAccountId.set(a.id, children.length > 0);
    }

    const { data: allMembers } = await supabase
      .from("account_members")
      .select("user_id, account_id, role");

    const memberCountByAccountId = new Map<string, number>();
    for (const m of allMembers ?? []) {
      memberCountByAccountId.set(
        m.account_id,
        (memberCountByAccountId.get(m.account_id) ?? 0) + 1
      );
    }

    const membersByUserId = new Map<string, { account_id: string; role: string }[]>();
    for (const m of allMembers ?? []) {
      if (!userIds.includes(m.user_id)) continue;
      const list = membersByUserId.get(m.user_id) ?? [];
      list.push({ account_id: m.account_id, role: m.role });
      membersByUserId.set(m.user_id, list);
    }

    const now = new Date();
    const users: UserListEntry[] = authUsers.map((u) => {
      const profile = profileByUserId.get(u.id);
      let status: UserListEntry["status"] = "active";
      if (u.banned_until && new Date(u.banned_until) > now) status = "suspended";
      else if (!u.email_confirmed_at) status = "pending";

      const memberships = membersByUserId.get(u.id) ?? [];
      const accounts: UserAccountEntry[] = memberships.map((m) => {
        const account = accountById.get(m.account_id);
        return {
          accountId: m.account_id,
          accountName: account?.name ?? "",
          role: m.role,
          memberCount: memberCountByAccountId.get(m.account_id) ?? 0,
          parentAccountName: parentAccountNameByAccountId.get(m.account_id) ?? null,
          hasSubaccounts: hasSubaccountsByAccountId.get(m.account_id) ?? false,
        };
      });

      return {
        id: u.id,
        email: u.email ?? null,
        name: profile?.display_name ?? null,
        website: profile?.website ?? null,
        status,
        createdAt: u.created_at,
        accounts,
      };
    });

    return { users };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list users";
    return { users: [], error: msg };
  }
}

export async function listAccountsForAdmin(): Promise<{
  accounts: AccountListEntry[];
  error?: string;
}> {
  const admin = await getAdminUser();
  if (!admin) return { accounts: [], error: "Unauthorized" };
  try {
    const supabase = createServiceRoleClient();
    const { data: allAccounts } = await supabase
      .from("accounts")
      .select("id, name, parent_account_id")
      .order("name");

    if (!allAccounts?.length) return { accounts: [] };

    const accountById = new Map(
      allAccounts.map((a) => [
        a.id,
        {
          id: a.id,
          name: a.name ?? "",
          parent_account_id: a.parent_account_id ?? null,
        },
      ])
    );

    const { data: allMembers } = await supabase
      .from("account_members")
      .select("account_id, user_id");

    const memberCountByAccountId = new Map<string, number>();
    const userIdsByAccountId = new Map<string, string[]>();
    for (const m of allMembers ?? []) {
      memberCountByAccountId.set(
        m.account_id,
        (memberCountByAccountId.get(m.account_id) ?? 0) + 1
      );
      const list = userIdsByAccountId.get(m.account_id) ?? [];
      list.push(m.user_id);
      userIdsByAccountId.set(m.account_id, list);
    }

    const allUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
    const emailByUserId = new Map<string, string>();
    const nameByUserId = new Map<string, string | null>();
    const statusByUserId = new Map<string, UserStatus>();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allUserIds);
      for (const p of profiles ?? []) {
        nameByUserId.set(p.user_id, p.display_name ?? null);
      }
      const {
        data: { users: authUsers },
      } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const now = new Date();
      for (const u of authUsers ?? []) {
        if (u.email) emailByUserId.set(u.id, u.email);
        let status: UserStatus = "active";
        if (u.banned_until && new Date(u.banned_until) > now) status = "suspended";
        else if (!u.email_confirmed_at) status = "pending";
        statusByUserId.set(u.id, status);
      }
    }

    const parentAccountNameByAccountId = new Map<string, string>();
    const hasSubaccountsByAccountId = new Map<string, boolean>();
    const subaccountCountByAccountId = new Map<string, number>();
    for (const a of allAccounts) {
      if (a.parent_account_id) {
        const parent = accountById.get(a.parent_account_id);
        parentAccountNameByAccountId.set(a.id, parent?.name ?? "");
      }
      const children = allAccounts.filter((x) => x.parent_account_id === a.id);
      hasSubaccountsByAccountId.set(a.id, children.length > 0);
      subaccountCountByAccountId.set(a.id, children.length);
    }

    const accountIds = allAccounts.map((a) => a.id);
    const { data: accountBillingRows } = await supabase
      .from("account_billing")
      .select("account_id, billing_account_id")
      .in("account_id", accountIds);
    const billingAccountIdByAccountId = new Map<string, string>();
    const billingAccountIds = new Set<string>();
    for (const row of accountBillingRows ?? []) {
      billingAccountIdByAccountId.set(row.account_id, row.billing_account_id);
      billingAccountIds.add(row.billing_account_id);
    }
    const ownerAccountIdByBillingAccountId = new Map<string, string>();
    const subscriptionByBillingAccountId = new Map<string, { status: string; plan: string | null }>();
    if (billingAccountIds.size > 0) {
      const { data: billingAccounts } = await supabase
        .from("billing_accounts")
        .select("id, owner_account_id")
        .in("id", [...billingAccountIds]);
      for (const ba of billingAccounts ?? []) {
        ownerAccountIdByBillingAccountId.set(ba.id, ba.owner_account_id);
      }
      const { data: subscriptionRows } = await supabase
        .from("subscriptions")
        .select("billing_account_id, status, plan, updated_at")
        .in("billing_account_id", [...billingAccountIds])
        .order("updated_at", { ascending: false });
      for (const s of subscriptionRows ?? []) {
        if (!subscriptionByBillingAccountId.has(s.billing_account_id)) {
          subscriptionByBillingAccountId.set(s.billing_account_id, {
            status: s.status,
            plan: s.plan ?? null,
          });
        }
      }
    }

    const accounts: AccountListEntry[] = allAccounts.map((a) => {
      const memberIds = userIdsByAccountId.get(a.id) ?? [];
      const memberEmails = memberIds
        .map((id) => emailByUserId.get(id))
        .filter((e): e is string => Boolean(e));
      const members: AccountMemberEntry[] = memberIds.map((userId) => ({
        userId,
        email: emailByUserId.get(userId) ?? "",
        name: nameByUserId.get(userId) ?? null,
        status: statusByUserId.get(userId) ?? "active",
      }));
      const billingAccountId = billingAccountIdByAccountId.get(a.id);
      let subscriptionStatus: string | null = null;
      let plan: string | null = null;
      let billingResponsible: string | null = null;
      if (billingAccountId) {
        const sub = subscriptionByBillingAccountId.get(billingAccountId);
        if (sub) {
          subscriptionStatus = sub.status;
          plan = sub.plan;
        }
        const ownerAccountId = ownerAccountIdByBillingAccountId.get(billingAccountId);
        if (ownerAccountId) {
          billingResponsible =
            ownerAccountId === a.id ? "Self" : (accountById.get(ownerAccountId)?.name ?? null);
        }
      }
      return {
        id: a.id,
        name: a.name ?? "",
        parent_account_id: a.parent_account_id ?? null,
        parentAccountName: parentAccountNameByAccountId.get(a.id) ?? null,
        memberCount: memberCountByAccountId.get(a.id) ?? 0,
        hasSubaccounts: hasSubaccountsByAccountId.get(a.id) ?? false,
        subaccountCount: subaccountCountByAccountId.get(a.id) ?? 0,
        memberEmails,
        members,
        subscriptionStatus,
        plan,
        billingResponsible,
      };
    });

    accounts.sort((a, b) => b.memberCount - a.memberCount);

    return { accounts };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to list accounts";
    return { accounts: [], error: msg };
  }
}

/**
 * Delete an account (admin only). Cascades to account_members, account_invitations,
 * account_billing; children become top-level (parent_account_id set to NULL).
 * Blocks if the current admin is a member of the account to avoid lockout.
 */
export async function deleteAccountAsAdmin(
  accountId: string,
  accountName: string | null
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };

  const supabase = createServiceRoleClient();

  const { data: membership } = await supabase
    .from("account_members")
    .select("id")
    .eq("account_id", accountId)
    .eq("user_id", admin.user.id)
    .maybeSingle();
  if (membership) return { error: "You cannot delete an account you are a member of" };

  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) return { error: error.message };
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
 * Suspend a user (admin only). Sets banned_until so they cannot sign in. Does not delete the user.
 */
export async function suspendUserAsAdmin(userId: string): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (admin.user.id === userId) return { error: "You cannot suspend your own account" };

  const supabase = createServiceRoleClient();
  const bannedUntil = new Date();
  bannedUntil.setFullYear(bannedUntil.getFullYear() + 10);
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    banned_until: bannedUntil.toISOString(),
  });
  if (error) return { error: error.message };
  return {};
}

/**
 * Delete a user (admin only). Tries to send a notification email; if that fails (e.g. RESEND_API_KEY not set),
 * still deletes the user and returns a warning. Related data (profiles, etc.) is removed by DB cascade.
 */
export async function deleteUserAsAdmin(
  userId: string,
  email: string | null
): Promise<{ error?: string; warning?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (admin.user.id === userId) return { error: "You cannot delete your own account" };

  try {
    let warning: string | undefined;
    if (email?.trim()) {
      const { sent, error: emailError } = await sendAccountDeletedEmail(email.trim());
      if (!sent && emailError) {
        warning = `User deleted. Notification email was not sent: ${emailError}`;
      }
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    return { warning };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return { error: msg };
  }
}
