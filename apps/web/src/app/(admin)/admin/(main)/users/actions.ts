"use server";

import { getAdminUser } from "@/lib/admin";
import { sendAccountDeletedEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export type UserOrgEntry = {
  orgId: string;
  orgName: string;
  role: string;
  memberCount: number;
  parentOrgName: string | null;
  hasSuborgs: boolean;
};

export type UserListEntry = {
  id: string;
  email: string | null;
  name: string | null;
  website: string | null;
  status: "active" | "pending" | "banned";
  createdAt: string;
  organizations: UserOrgEntry[];
};

export type OrganizationListEntry = {
  id: string;
  name: string;
  parentOrgName: string | null;
  memberCount: number;
  hasSuborgs: boolean;
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

    const { data: allOrgs } = await supabase
      .from("organizations")
      .select("id, name, parent_organization_id");

    const orgById = new Map(
      (allOrgs ?? []).map((o) => [
        o.id,
        {
          id: o.id,
          name: o.name ?? "",
          parent_organization_id: o.parent_organization_id ?? null,
        },
      ])
    );

    const parentOrgNameByOrgId = new Map<string, string>();
    const hasSuborgsByOrgId = new Map<string, boolean>();
    for (const o of allOrgs ?? []) {
      if (o.parent_organization_id) {
        const parent = orgById.get(o.parent_organization_id);
        parentOrgNameByOrgId.set(o.id, parent?.name ?? "");
      }
      const children = (allOrgs ?? []).filter(
        (x) => x.parent_organization_id === o.id
      );
      hasSuborgsByOrgId.set(o.id, children.length > 0);
    }

    const { data: allMembers } = await supabase
      .from("organization_members")
      .select("user_id, organization_id, role");

    const memberCountByOrgId = new Map<string, number>();
    for (const m of allMembers ?? []) {
      memberCountByOrgId.set(
        m.organization_id,
        (memberCountByOrgId.get(m.organization_id) ?? 0) + 1
      );
    }

    const membersByUserId = new Map<string, { organization_id: string; role: string }[]>();
    for (const m of allMembers ?? []) {
      if (!userIds.includes(m.user_id)) continue;
      const list = membersByUserId.get(m.user_id) ?? [];
      list.push({ organization_id: m.organization_id, role: m.role });
      membersByUserId.set(m.user_id, list);
    }

    const now = new Date();
    const users: UserListEntry[] = authUsers.map((u) => {
      const profile = profileByUserId.get(u.id);
      let status: UserListEntry["status"] = "active";
      if (u.banned_until && new Date(u.banned_until) > now) status = "banned";
      else if (!u.email_confirmed_at) status = "pending";

      const memberships = membersByUserId.get(u.id) ?? [];
      const organizations: UserOrgEntry[] = memberships.map((m) => {
        const org = orgById.get(m.organization_id);
        return {
          orgId: m.organization_id,
          orgName: org?.name ?? "",
          role: m.role,
          memberCount: memberCountByOrgId.get(m.organization_id) ?? 0,
          parentOrgName: parentOrgNameByOrgId.get(m.organization_id) ?? null,
          hasSuborgs: hasSuborgsByOrgId.get(m.organization_id) ?? false,
        };
      });

      return {
        id: u.id,
        email: u.email ?? null,
        name: profile?.display_name ?? null,
        website: profile?.website ?? null,
        status,
        createdAt: u.created_at,
        organizations,
      };
    });

    return { users };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list users";
    return { users: [], error: msg };
  }
}

export async function listOrganizationsForAdmin(): Promise<{
  organizations: OrganizationListEntry[];
  error?: string;
}> {
  const admin = await getAdminUser();
  if (!admin) return { organizations: [], error: "Unauthorized" };
  try {
    const supabase = createServiceRoleClient();
    const { data: allOrgs } = await supabase
      .from("organizations")
      .select("id, name, parent_organization_id")
      .order("name");

    if (!allOrgs?.length) return { organizations: [] };

    const orgById = new Map(
      allOrgs.map((o) => [
        o.id,
        {
          id: o.id,
          name: o.name ?? "",
          parent_organization_id: o.parent_organization_id ?? null,
        },
      ])
    );

    const { data: allMembers } = await supabase
      .from("organization_members")
      .select("organization_id, user_id");

    const memberCountByOrgId = new Map<string, number>();
    const userIdsByOrgId = new Map<string, string[]>();
    for (const m of allMembers ?? []) {
      memberCountByOrgId.set(
        m.organization_id,
        (memberCountByOrgId.get(m.organization_id) ?? 0) + 1
      );
      const list = userIdsByOrgId.get(m.organization_id) ?? [];
      list.push(m.user_id);
      userIdsByOrgId.set(m.organization_id, list);
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

    const parentOrgNameByOrgId = new Map<string, string>();
    const hasSuborgsByOrgId = new Map<string, boolean>();
    for (const o of allOrgs) {
      if (o.parent_organization_id) {
        const parent = orgById.get(o.parent_organization_id);
        parentOrgNameByOrgId.set(o.id, parent?.name ?? "");
      }
      const children = allOrgs.filter((x) => x.parent_organization_id === o.id);
      hasSuborgsByOrgId.set(o.id, children.length > 0);
    }

    const organizations: OrganizationListEntry[] = allOrgs.map((o) => {
      const memberIds = userIdsByOrgId.get(o.id) ?? [];
      const memberEmails = memberIds
        .map((id) => emailByUserId.get(id))
        .filter((e): e is string => Boolean(e));
      return {
        id: o.id,
        name: o.name ?? "",
        parentOrgName: parentOrgNameByOrgId.get(o.id) ?? null,
        memberCount: memberCountByOrgId.get(o.id) ?? 0,
        hasSuborgs: hasSuborgsByOrgId.get(o.id) ?? false,
        memberEmails,
      };
    });

    organizations.sort((a, b) => b.memberCount - a.memberCount);

    return { organizations };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to list organizations";
    return { organizations: [], error: msg };
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
