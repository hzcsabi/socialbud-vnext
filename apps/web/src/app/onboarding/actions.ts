"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  redirect("/app");
}
