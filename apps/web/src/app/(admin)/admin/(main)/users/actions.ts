"use server";

import { getAdminUser } from "@/lib/admin";
import { sendAccountDeletedEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export type UserListEntry = {
  id: string;
  email: string | null;
  name: string | null;
  website: string | null;
  status: "active" | "pending" | "banned";
  createdAt: string;
  orgType: "individual" | "team" | "corporation" | null;
  orgName: string | null;
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

    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id, organization_id")
      .in("user_id", userIds)
      .order("organization_id");

    const orgIds = [
      ...new Set((members ?? []).map((m) => m.organization_id)),
    ];
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, kind, name")
      .in("id", orgIds);

    const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
    const firstOrgByUserId = new Map<string, { kind: "individual" | "team" | "corporation"; name: string }>();
    for (const m of members ?? []) {
      if (!firstOrgByUserId.has(m.user_id)) {
        const org = orgById.get(m.organization_id);
        if (org && (org.kind === "individual" || org.kind === "team" || org.kind === "corporation")) {
          firstOrgByUserId.set(m.user_id, {
            kind: org.kind,
            name: org.name ?? "",
          });
        }
      }
    }

    const now = new Date();
    const users: UserListEntry[] = authUsers.map((u) => {
      const profile = profileByUserId.get(u.id);
      const org = firstOrgByUserId.get(u.id);
      let status: UserListEntry["status"] = "active";
      if (u.banned_until && new Date(u.banned_until) > now) status = "banned";
      else if (!u.email_confirmed_at) status = "pending";

      return {
        id: u.id,
        email: u.email ?? null,
        name: profile?.display_name ?? null,
        website: profile?.website ?? null,
        status,
        createdAt: u.created_at,
        orgType: org?.kind ?? null,
        orgName: org?.name ?? null,
      };
    });

    return { users };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list users";
    return { users: [], error: msg };
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
