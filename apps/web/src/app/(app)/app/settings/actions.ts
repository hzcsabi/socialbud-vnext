"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const adminSupabase = createServiceRoleClient();
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete account";
    return { error: msg };
  }
}
