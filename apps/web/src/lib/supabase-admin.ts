import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Set or clear auth.users.banned_until for a user.
 * Supabase's AdminUserAttributes type does not yet include banned_until, so this helper
 * centralizes the type-cast workaround in one place.
 */
export async function updateUserBannedUntil(
  supabase: SupabaseClient,
  userId: string,
  bannedUntil: string | null
): Promise<void> {
  await supabase.auth.admin.updateUserById(userId, {
    banned_until: bannedUntil,
  } as Parameters<typeof supabase.auth.admin.updateUserById>[1]);
}
