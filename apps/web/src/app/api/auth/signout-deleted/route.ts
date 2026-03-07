import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function isAllowedRedirect(path: string): boolean {
  return /^\/[^:]*$/.test(path ?? "");
}

/** Signs out and redirects to login with a flash cookie so the page can show "No user found" without exposing reason in the URL. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");
  const target =
    redirectTo && isAllowedRedirect(redirectTo)
      ? new URL(redirectTo, url.origin)
      : new URL("/login", url.origin);
  const res = NextResponse.redirect(target, { status: 302 });
  res.cookies.set("login_error", "no_user_found", {
    path: "/",
    maxAge: 60,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
