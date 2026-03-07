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
  status: "active" | "pending" | "banned";
  createdAt: string;
  accounts: UserAccountEntry[];
};

export type AccountListEntry = {
  id: string;
  name: string;
  parent_account_id: string | null;
  parentAccountName: string | null;
  memberCount: number;
  hasSubaccounts: boolean;
  memberEmails: string[];
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
      if (u.banned_until && new Date(u.banned_until) > now) status = "banned";
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
    if (allUserIds.length > 0) {
      const {
        data: { users: authUsers },
      } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      for (const u of authUsers ?? []) {
        if (u.email) emailByUserId.set(u.id, u.email);
      }
    }

    const parentAccountNameByAccountId = new Map<string, string>();
    const hasSubaccountsByAccountId = new Map<string, boolean>();
    for (const a of allAccounts) {
      if (a.parent_account_id) {
        const parent = accountById.get(a.parent_account_id);
        parentAccountNameByAccountId.set(a.id, parent?.name ?? "");
      }
      const children = allAccounts.filter((x) => x.parent_account_id === a.id);
      hasSubaccountsByAccountId.set(a.id, children.length > 0);
    }

    const accounts: AccountListEntry[] = allAccounts.map((a) => {
      const memberIds = userIdsByAccountId.get(a.id) ?? [];
      const memberEmails = memberIds
        .map((id) => emailByUserId.get(id))
        .filter((e): e is string => Boolean(e));
      return {
        id: a.id,
        name: a.name ?? "",
        parent_account_id: a.parent_account_id ?? null,
        parentAccountName: parentAccountNameByAccountId.get(a.id) ?? null,
        memberCount: memberCountByAccountId.get(a.id) ?? 0,
        hasSubaccounts: hasSubaccountsByAccountId.get(a.id) ?? false,
        memberEmails,
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
