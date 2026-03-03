"use server";

import { getAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export type AdminEntry = { user_id: string; email: string | null };

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
    const admins: AdminEntry[] = [];
    for (const row of rows ?? []) {
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(row.user_id);
      admins.push({ user_id: row.user_id, email: user?.email ?? null });
    }
    return { admins };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list admins";
    return { admins: [], error: msg };
  }
}

export async function addAdminByEmail(
  email: string
): Promise<{ error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "Unauthorized" };
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Email is required" };
  try {
    const supabase = createServiceRoleClient();
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { error: listError.message };
    const user = users?.find((u) => u.email?.toLowerCase() === trimmed);
    if (!user) return { error: "No user found with this email" };
    const { error: insertError } = await supabase.from("admins").insert({
      user_id: user.id,
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
