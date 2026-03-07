"use server";

import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import type { AccountListEntry, AccountMemberEntry, MemberRole, UserStatus } from "./shared";

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
      .is("deleted_at", null)
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
      .select("account_id, user_id, role");

    const memberCountByAccountId = new Map<string, number>();
    const userIdsByAccountId = new Map<string, string[]>();
    const roleByAccountAndUser = new Map<string, MemberRole>();
    for (const m of allMembers ?? []) {
      memberCountByAccountId.set(
        m.account_id,
        (memberCountByAccountId.get(m.account_id) ?? 0) + 1
      );
      const list = userIdsByAccountId.get(m.account_id) ?? [];
      list.push(m.user_id);
      userIdsByAccountId.set(m.account_id, list);
      const role = m.role === "owner" || m.role === "manager" || m.role === "member" ? m.role : "member";
      roleByAccountAndUser.set(`${m.account_id}:${m.user_id}`, role);
    }

    const allUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
    const emailByUserId = new Map<string, string>();
    const nameByUserId = new Map<string, string | null>();
    const statusByUserId = new Map<string, UserStatus>();
    const deletedUserIds = new Set<string>();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, suspended_at, deleted_at")
        .in("user_id", allUserIds);
      const suspendedAtByUserId = new Map<string, string>();
      for (const p of profiles ?? []) {
        nameByUserId.set(p.user_id, p.display_name ?? null);
        if (p.suspended_at) suspendedAtByUserId.set(p.user_id, p.suspended_at);
        if (p.deleted_at) deletedUserIds.add(p.user_id);
      }
      const {
        data: { users: authUsers },
      } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const now = new Date();
      for (const u of authUsers ?? []) {
        if (u.email) emailByUserId.set(u.id, u.email);
        let status: UserStatus = "active";
        const profileSuspended = suspendedAtByUserId.has(u.id) && new Date(suspendedAtByUserId.get(u.id)!) > now;
        const authSuspended = u.banned_until && new Date(u.banned_until) > now;
        if (profileSuspended || authSuspended) status = "suspended";
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
      const allMemberIds = userIdsByAccountId.get(a.id) ?? [];
      const memberIds = allMemberIds.filter((id) => !deletedUserIds.has(id));
      const memberEmails = memberIds
        .map((id) => emailByUserId.get(id))
        .filter((e): e is string => Boolean(e));
      const members: AccountMemberEntry[] = memberIds.map((userId) => ({
        userId,
        email: emailByUserId.get(userId) ?? "",
        name: nameByUserId.get(userId) ?? null,
        status: statusByUserId.get(userId) ?? "active",
        role: roleByAccountAndUser.get(`${a.id}:${userId}`) ?? "member",
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
        memberCount: memberIds.length,
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
