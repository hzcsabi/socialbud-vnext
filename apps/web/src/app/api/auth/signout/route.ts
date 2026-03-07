import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function isAllowedRedirect(path: string): boolean {
  return /^\/[^:]*$/.test(path ?? "");
}

function getRedirectTarget(request: NextRequest): URL {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");
  return redirectTo && isAllowedRedirect(redirectTo)
    ? new URL(redirectTo, url.origin)
    : new URL("/", url.origin);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getRedirectTarget(request), { status: 302 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getRedirectTarget(request), { status: 302 });
}
