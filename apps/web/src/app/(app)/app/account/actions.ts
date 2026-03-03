"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const displayName = (formData.get("display_name") as string)?.trim() ?? null;
  const companyName = (formData.get("company_name") as string)?.trim() ?? null;
  const website = (formData.get("website") as string)?.trim() ?? null;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      company_name: companyName,
      website: website,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
