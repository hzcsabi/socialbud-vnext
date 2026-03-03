"use client";

import { createClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * OAuth callback page (e.g. after "Continue with Google").
 * Supabase redirects here with ?code=; we exchange it for a session on the client
 * then do a full redirect to /app so the app layout sees the session.
 */
export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (handled.current) return;
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing code");
      return;
    }
    handled.current = true;

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, 15000);

    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => {
        window.clearTimeout(timeoutId);
        window.location.replace("/app");
      })
      .catch((err) => {
        window.clearTimeout(timeoutId);
        handled.current = false;
        setError(err?.message ?? "Sign-in failed");
      });
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <a href="/login" className="mt-4 inline-block text-sm text-primary underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">This is taking longer than usual.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-primary underline">
            Try signing in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
