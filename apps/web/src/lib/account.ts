"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import { ensureUserAccount } from "@socialbud/services";

/**
 * Ensures the current user has at least one account and membership (creates
 * account + owner membership if missing). No-op if they already have a membership.
 * @throws if ensure fails (e.g. missing service role env or DB error)
 */
export async function ensureCurrentUserAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const adminSupabase = createServiceRoleClient();
  await ensureUserAccount(adminSupabase, user.id);
}

/**
 * Returns the first account where the current user is a member.
 * If the user has no account membership yet, creates an account and adds them
 * as owner, then returns it.
 */
export async function getCurrentUserAccount(): Promise<{
  id: string;
  name: string;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const adminSupabase = createServiceRoleClient();
    const accountId = await ensureUserAccount(adminSupabase, user.id);

    const { data: account } = await adminSupabase
      .from("accounts")
      .select("id, name")
      .eq("id", accountId)
      .single();

    return account ? { id: account.id, name: account.name } : null;
  } catch {
    return null;
  }
}
