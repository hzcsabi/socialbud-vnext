"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

/**
 * Ensures the current user has at least one organization and membership (creates
 * org + owner membership if missing). No-op if they already have a membership.
 * Uses service-role as source of truth so we never create a duplicate when the
 * user's session would miss an existing membership.
 * @throws if ensure fails (e.g. missing service role env or DB error)
 */
export async function ensureCurrentUserOrganization(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existingMember) return;

  const adminSupabase = createServiceRoleClient();
  const { data: existingViaAdmin } = await adminSupabase
    .from("organization_members")
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
  const orgName = displayName || companyName || "My workspace";

  const { data: org, error: orgError } = await adminSupabase
    .from("organizations")
    .insert({ name: orgName, slug: null })
    .select("id")
    .single();
  if (orgError || !org) throw new Error(orgError?.message ?? "Failed to create organization");

  const { error: memberError } = await adminSupabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    });
  if (memberError) throw new Error(memberError.message);
}

/**
 * Returns the first organization where the current user is a member.
 * If the user has no organization membership yet, creates an org and adds them
 * as owner in the same request (same auth context) so Settings always sees the org.
 */
export async function getCurrentUserOrganization(): Promise<{
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
      .from("organization_members")
      .select("organization_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((r) => r.data);

    if (!member) {
      const adminSupabase = createServiceRoleClient();
      const { data: existingViaAdmin } = await adminSupabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (existingViaAdmin) {
        const { data: org } = await adminSupabase
          .from("organizations")
          .select("id, name")
          .eq("id", existingViaAdmin.organization_id)
          .single();
        if (org) return { id: org.id, name: org.name };
        return null;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, company_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const displayName = (profile?.display_name as string)?.trim() ?? "";
      const companyName = (profile?.company_name as string)?.trim() ?? null;
      const orgName = displayName || companyName || "My workspace";

      try {
        const { data: org, error: orgError } = await adminSupabase
          .from("organizations")
          .insert({ name: orgName, slug: null })
          .select("id, name")
          .single();
        if (orgError || !org) return null;

        const { error: memberError } = await adminSupabase
          .from("organization_members")
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "owner",
          });
        if (memberError) return null;
        return { id: org.id, name: org.name };
      } catch {
        return null;
      }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", member.organization_id)
      .single();
    if (org) return { id: org.id, name: org.name };
    return null;
  } catch {
    return null;
  }
}
