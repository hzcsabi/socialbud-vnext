"use server";

import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import type { UserAccountEntry, UserListEntry } from "./shared";

export async function listUsersForAdmin(options?: { includeDeleted?: boolean }): Promise<{
  users: UserListEntry[];
  error?: string;
}> {
  const includeDeleted = options?.includeDeleted === true;
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
      .select("user_id, display_name, website, suspended_at, deleted_at")
      .in("user_id", userIds);

    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const { data: allAccounts } = await supabase
      .from("accounts")
      .select("id, name, parent_account_id")
      .is("deleted_at", null);

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
    const users: UserListEntry[] = authUsers
      .filter((u) => {
        const profile = profileByUserId.get(u.id);
        if (includeDeleted) return Boolean(profile?.deleted_at);
        if (profile?.deleted_at) return false;
        return true;
      })
      .map((u) => {
        const profile = profileByUserId.get(u.id);
        const isDeleted = Boolean(profile?.deleted_at);
        let status: UserListEntry["status"] = isDeleted ? "deleted" : "active";
        if (!isDeleted) {
          const profileSuspended = profile?.suspended_at && new Date(profile.suspended_at) > now;
          const authSuspended = u.banned_until && new Date(u.banned_until) > now;
          if (profileSuspended || authSuspended) status = "suspended";
          else if (!u.email_confirmed_at) status = "pending";
        }

        const memberships = membersByUserId.get(u.id) ?? [];
        // Dedupe by account_id (keep first; duplicate rows in account_members would otherwise show same account twice)
        const seenAccountIds = new Set<string>();
        const accounts: UserAccountEntry[] = memberships
          .filter((m) => {
            if (seenAccountIds.has(m.account_id)) return false;
            seenAccountIds.add(m.account_id);
            return true;
          })
          .map((m) => {
            const account = accountById.get(m.account_id);
            const rawName = account?.name?.trim() ?? "";
            return {
              accountId: m.account_id,
              accountName: rawName || "Unnamed account",
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
