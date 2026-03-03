"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Runs on the client when the URL contains Supabase auth tokens in the hash
 * (default email confirmation redirect). Parses the hash, sets the session
 * via the browser client (which persists to cookies with @supabase/ssr),
 * then redirects to /app.
 */
export function AuthHashHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;
    const hash = window.location.hash?.replace(/^#/, "") || "";
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (!accessToken || !refreshToken) return;
    handled.current = true;
    const supabase = createClient();
    const goToSetPassword = type === "recovery" || type === "signup" || type === "email";
    const nextPath = goToSetPassword ? "/auth/set-password" : "/app";
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        window.history.replaceState(null, "", pathname ?? "/");
        router.push(nextPath);
        router.refresh();
      })
      .catch(() => {
        handled.current = false;
      });
  }, [pathname, router]);

  return null;
}
