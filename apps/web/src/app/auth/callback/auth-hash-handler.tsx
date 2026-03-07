"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Runs on the client to complete Supabase auth redirects:
 * 1. Hash (#access_token, #refresh_token) – email confirmation / magic link.
 * 2. Query (?code=) – OAuth (e.g. Google) PKCE flow; exchange code for session.
 * Sets the session in cookies then redirects to /app, /onboarding, or /auth/set-password.
 */
export function AuthHashHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;

    const supabase = createClient();

    // OAuth PKCE: Supabase redirects with ?code= (e.g. after Google sign-in)
    const search = window.location.search || "";
    const searchParams = new URLSearchParams(search);
    const code = searchParams.get("code");
    if (code) {
      handled.current = true;
      supabase.auth
        .exchangeCodeForSession(code)
        .then(() => {
          const nextPath = "/select-account";
          window.history.replaceState(null, "", pathname ?? "/");
          router.push(nextPath);
          router.refresh();
        })
        .catch(() => {
          handled.current = false;
        });
      return;
    }

    // Hash: email confirmation / magic link
    const hash = window.location.hash?.replace(/^#/, "") || "";
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (!accessToken || !refreshToken) return;
    handled.current = true;
    const goToSetPassword = type === "recovery";
    const goToOnboarding = type === "signup" || type === "email";
    const nextPath = goToSetPassword
      ? "/auth/set-password"
      : goToOnboarding
        ? "/onboarding"
        : "/select-account";
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
