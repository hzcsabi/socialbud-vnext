import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function isAllowedRedirect(path: string): boolean {
  return /^\/[^:]*$/.test(path ?? "");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");
  const target =
    redirectTo && isAllowedRedirect(redirectTo)
      ? new URL(redirectTo, url.origin)
      : new URL("/", url.origin);
  return NextResponse.redirect(target, { status: 302 });
}
