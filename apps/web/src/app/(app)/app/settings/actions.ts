"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

/** Soft-delete: set profile.deleted_at and ban auth so user cannot sign in. Data kept for analytics. */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const adminSupabase = createServiceRoleClient();
    const now = new Date().toISOString();
    const bannedUntil = new Date();
    bannedUntil.setFullYear(bannedUntil.getFullYear() + 10);

    const { data: updated, error: updateError } = await adminSupabase
      .from("profiles")
      .update({ deleted_at: now, updated_at: now })
      .eq("user_id", user.id)
      .select("user_id");
    if (updateError) return { error: updateError.message };
    if (!updated?.length) {
      const { error: insertError } = await adminSupabase
        .from("profiles")
        .upsert(
          { user_id: user.id, deleted_at: now, updated_at: now },
          { onConflict: "user_id" }
        );
      if (insertError) return { error: insertError.message };
    }

    // Supabase API supports banned_until; AdminUserAttributes type is not yet updated in @supabase/supabase-js
    await adminSupabase.auth.admin.updateUserById(user.id, {
      banned_until: bannedUntil.toISOString(),
    } as Parameters<typeof adminSupabase.auth.admin.updateUserById>[1]);
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete account";
    return { error: msg };
  }
}
