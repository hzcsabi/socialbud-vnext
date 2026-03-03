"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = (formData.get("display_name") as string)?.trim() ?? "";
  const companyName = (formData.get("company_name") as string)?.trim() ?? null;
  const website = (formData.get("website") as string)?.trim() ?? null;

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName || null,
      company_name: companyName || null,
      website: website || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingMember) {
    const adminSupabase = createServiceRoleClient();
    const orgName =
      displayName || companyName || "My workspace";

    const { data: org, error: orgError } = await adminSupabase
      .from("organizations")
      .insert({ kind: "individual", name: orgName, slug: null })
      .select("id")
      .single();

    if (orgError) {
      return { error: orgError.message };
    }

    const { error: memberError } = await adminSupabase
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return { error: memberError.message };
    }
  }

  redirect("/app");
}
