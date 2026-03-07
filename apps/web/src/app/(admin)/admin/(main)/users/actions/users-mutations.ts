"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { sendAccountDeletedEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import { updateUserBannedUntil } from "@/lib/supabase-admin";

/**
 * Suspend a user (admin only). Sets profiles.suspended_at so status shows as suspended in admin UI.
 * Suspended users can still sign in; they see a notice in the app to contact support.
 */
export async function suspendUserAsAdmin(userId: string): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (admin.user.id === userId) return { error: "You cannot suspend your own account" };

  const supabase = createServiceRoleClient();
  const suspendedUntil = new Date();
  suspendedUntil.setFullYear(suspendedUntil.getFullYear() + 10);
  const iso = suspendedUntil.toISOString();
  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, suspended_at: iso, updated_at: now },
      { onConflict: "user_id" }
    );
  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/users");
  return {};
}

/**
 * Unsuspend a user (admin only). Clears profiles.suspended_at and auth banned_until.
 */
export async function unsuspendUserAsAdmin(userId: string): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (admin.user.id === userId) return { error: "You cannot change your own account" };

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ suspended_at: null, updated_at: now })
    .eq("user_id", userId);
  if (profileError) return { error: profileError.message };

  await updateUserBannedUntil(supabase, userId, null);
  revalidatePath("/admin/users");
  return {};
}

/**
 * Soft-delete a user (admin only). Sets profiles.deleted_at and auth banned_until so they disappear from
 * the admin UI and cannot sign in. Also soft-deletes any accounts where the user was the sole member.
 * Data is preserved for analytics. Optionally sends a notification email.
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
        warning = `User deactivated. Notification email was not sent: ${emailError}`;
      }
    }

    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();
    const bannedUntil = new Date();
    bannedUntil.setFullYear(bannedUntil.getFullYear() + 10);

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ deleted_at: now, updated_at: now })
      .eq("user_id", userId)
      .select("user_id");
    if (updateError) {
      const msg = updateError.message;
      if (msg?.includes("deleted_at") || msg?.includes("column"))
        return { error: `${msg} Run the migration to add deleted_at (e.g. pnpm db:migrate or ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL).` };
      return { error: msg };
    }
    if (!updated?.length) {
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, deleted_at: now, updated_at: now },
          { onConflict: "user_id" }
        );
      if (insertError) {
        const msg = insertError.message;
        if (msg?.includes("deleted_at") || msg?.includes("column"))
          return { error: `${msg} Run the migration to add deleted_at.` };
        return { error: msg };
      }
    }

    const { data: userMemberships } = await supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", userId);
    const accountIds = [...new Set((userMemberships ?? []).map((m) => m.account_id))];
    if (accountIds.length > 0) {
      const { data: allMembersInAccounts } = await supabase
        .from("account_members")
        .select("account_id")
        .in("account_id", accountIds);
      const memberCountByAccountId = new Map<string, number>();
      for (const m of allMembersInAccounts ?? []) {
        memberCountByAccountId.set(
          m.account_id,
          (memberCountByAccountId.get(m.account_id) ?? 0) + 1
        );
      }
      const soleMemberAccountIds = accountIds.filter(
        (id) => (memberCountByAccountId.get(id) ?? 0) === 1
      );
      if (soleMemberAccountIds.length > 0) {
        const { error: accountsError } = await supabase
          .from("accounts")
          .update({ deleted_at: now, updated_at: now })
          .in("id", soleMemberAccountIds);
        if (accountsError) return { error: accountsError.message };
      }
    }

    await updateUserBannedUntil(supabase, userId, bannedUntil.toISOString());
    revalidatePath("/admin/users");
    return { warning };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return { error: msg };
  }
}
