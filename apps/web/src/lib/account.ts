"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

/**
 * Ensures the current user has at least one account and membership (creates
 * account + owner membership if missing). No-op if they already have a membership.
 * Uses service-role as source of truth so we never create a duplicate when the
 * user's session would miss an existing membership.
 * @throws if ensure fails (e.g. missing service role env or DB error)
 */
export async function ensureCurrentUserAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existingMember, error: selectError } = await supabase
    .from("account_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (selectError) return;
  if (existingMember) return;

  const adminSupabase = createServiceRoleClient();
  const { data: existingViaAdmin } = await adminSupabase
    .from("account_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existingViaAdmin) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const displayName = (profile?.display_name as string)?.trim() ?? "";
  const companyName = (profile?.company_name as string)?.trim() ?? null;
  const accountName = displayName || companyName || "My workspace";

  const { data: account, error: accountError } = await adminSupabase
    .from("accounts")
    .insert({ name: accountName, slug: null })
    .select("id")
    .single();
  if (accountError || !account) throw new Error(accountError?.message ?? "Failed to create account");

  const { error: insertMemberError } = await adminSupabase
    .from("account_members")
    .insert({
      account_id: account.id,
      user_id: user.id,
      role: "owner",
    });
  if (insertMemberError) throw new Error(insertMemberError.message);
}

/**
 * Returns the first account where the current user is a member.
 * If the user has no account membership yet, creates an account and adds them
 * as owner in the same request (same auth context) so Settings always sees the account.
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

    let member = await supabase
      .from("account_members")
      .select("account_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((r) => r.data);

    if (!member) {
      const adminSupabase = createServiceRoleClient();
      const { data: existingViaAdmin } = await adminSupabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (existingViaAdmin) {
        const { data: account } = await adminSupabase
          .from("accounts")
          .select("id, name")
          .eq("id", existingViaAdmin.account_id)
          .single();
        if (account) return { id: account.id, name: account.name };
        return null;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, company_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const displayName = (profile?.display_name as string)?.trim() ?? "";
      const companyName = (profile?.company_name as string)?.trim() ?? null;
      const accountName = displayName || companyName || "My workspace";

      try {
        const { data: account, error: accountError } = await adminSupabase
          .from("accounts")
          .insert({ name: accountName, slug: null })
          .select("id, name")
          .single();
        if (accountError || !account) return null;

        const { error: memberError } = await adminSupabase
          .from("account_members")
          .insert({
            account_id: account.id,
            user_id: user.id,
            role: "owner",
          });
        if (memberError) return null;
        return { id: account.id, name: account.name };
      } catch {
        return null;
      }
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("id", member.account_id)
      .single();
    if (account) return { id: account.id, name: account.name };
    return null;
  } catch {
    return null;
  }
}
