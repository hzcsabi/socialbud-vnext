import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<{ user: User } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return null;
  return { user };
}
