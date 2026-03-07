import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the user has at least one account membership. If they already have an
 * account_members record, returns that account_id. Otherwise creates an account
 * and owner membership and returns the new account_id.
 * @param db - Supabase client (service role) with read/write to profiles, accounts, account_members
 * @param userId - auth user id
 * @returns account_id (existing or newly created)
 */
export async function ensureUserAccount(
  db: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: existingMember } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingMember?.account_id) {
    return existingMember.account_id;
  }

  const { data: profile } = await db
    .from("profiles")
    .select("display_name, company_name")
    .eq("user_id", userId)
    .maybeSingle();

  const displayName = (profile?.display_name as string)?.trim() ?? "";
  const companyName = (profile?.company_name as string)?.trim() ?? null;
  const accountName = displayName || companyName || "My workspace";

  const { data: account, error: accountError } = await db
    .from("accounts")
    .insert({ name: accountName, slug: null })
    .select("id")
    .single();

  if (accountError || !account) {
    throw new Error(accountError?.message ?? "Failed to create account");
  }

  const { error: memberError } = await db.from("account_members").insert({
    account_id: account.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  return account.id;
}
