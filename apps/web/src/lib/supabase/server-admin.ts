import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with service role. Use only on the server, and only in
 * code paths that have already verified the current user is an admin.
 * Never expose this client or the service role key to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase service role env vars");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
