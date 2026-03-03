"use server";

import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export type AdminEntry = { user_id: string; email: string | null; name: string | null };

export async function listAdmins(): Promise<{ admins: AdminEntry[]; error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { admins: [], error: "Unauthorized" };
  try {
    const supabase = createServiceRoleClient();
    const { data: rows, error: listError } = await supabase
      .from("admins")
      .select("user_id")
      .order("created_at", { ascending: true });
    if (listError) return { admins: [], error: listError.message };

    const adminRows = rows ?? [];
    if (adminRows.length === 0) return { admins: [] };

    const adminIds = adminRows.map((r) => r.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", adminIds);

    const nameByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id as string, (p as any).display_name as string | null])
    );

    const admins: AdminEntry[] = [];
    for (const row of adminRows) {
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(row.user_id);
      admins.push({
        user_id: row.user_id,
        email: user?.email ?? null,
        name: nameByUserId.get(row.user_id) ?? null,
      });
    }

    return { admins };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list admins";
    return { admins: [], error: msg };
  }
}

export type UserLookupEntry = { id: string; email: string | null; name: string | null };

export async function searchUsersForAdmin(
  query: string
): Promise<{ users: UserLookupEntry[]; error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { users: [], error: "Unauthorized" };
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return { users: [] };
  try {
    const supabase = createServiceRoleClient();
    const { data: adminRows } = await supabase
      .from("admins")
      .select("user_id");
    const adminIds = new Set((adminRows ?? []).map((r) => r.user_id));

    const {
      data: { users: authUsers },
      error: listError,
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { users: [], error: listError.message };
    if (!authUsers?.length) return { users: [] };

    const userIds = authUsers.map((u) => u.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const nameByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name ?? null])
    );

    const matches: UserLookupEntry[] = [];
    for (const u of authUsers) {
      if (adminIds.has(u.id)) continue;
      const email = (u.email ?? "").toLowerCase();
      const name = (nameByUserId.get(u.id) ?? "").toLowerCase();
      if (
        email.includes(trimmed) ||
        name.includes(trimmed)
      ) {
        matches.push({
          id: u.id,
          email: u.email ?? null,
          name: nameByUserId.get(u.id) ?? null,
        });
      }
    }
    return { users: matches.slice(0, 20) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to search users";
    return { users: [], error: msg };
  }
}

export async function addAdminByUserId(
  userId: string
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (!userId) return { error: "User is required" };
  try {
    const supabase = createServiceRoleClient();
    const { error: insertError } = await supabase.from("admins").insert({
      user_id: userId,
    });
    if (insertError) {
      if (insertError.code === "23505") return { error: "User is already an admin" };
      return { error: insertError.message };
    }
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add admin";
    return { error: msg };
  }
}

export async function removeAdmin(userId: string): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  if (userId === admin.user.id) return { error: "You cannot remove your own admin access" };
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("admins").delete().eq("user_id", userId);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to remove admin";
    return { error: msg };
  }
}
