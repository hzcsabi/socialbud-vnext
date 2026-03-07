import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles auth redirects from Supabase (email confirmation, magic link, etc.).
 * Supabase must redirect here with token_hash and type in the query string.
 *
 * 1. In Supabase: Authentication → URL Configuration → Redirect URLs:
 *    Add: http://localhost:3000/auth/callback (and your production URL).
 *
 * 2. In Supabase: Authentication → Email Templates → Confirm signup (and Magic link if used),
 *    set the link to use this callback so the server can set cookies:
 *    {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/app
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextPath = url.searchParams.get("next") ?? "/select-account";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_params", url.origin), {
      status: 302,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email" | "magiclink" | "recovery" | "signup",
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      { status: 302 }
    );
  }

  const allowedNext = nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.includes(":");
  const destination = allowedNext ? nextPath : "/select-account";
  return NextResponse.redirect(new URL(destination, url.origin), { status: 302 });
}
