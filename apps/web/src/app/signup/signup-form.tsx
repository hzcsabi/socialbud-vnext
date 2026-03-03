"use client";

import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialEmail?: string;
  invitationToken?: string;
};

export function SignupForm({ initialEmail, invitationToken }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (invitationToken) {
      window.location.href = `/invite/accept?token=${encodeURIComponent(invitationToken)}`;
      return;
    }
    setSuccess(true);
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/oauth-callback` },
    });
    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) window.location.href = data.url;
    else setGoogleLoading(false);
  }

  if (success) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const anyLoading = loading || googleLoading;

  return (
    <div className="mt-4 space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={anyLoading}
        onClick={handleGoogleSignUp}
      >
        {googleLoading && (
          <span
            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>
      <div className="relative my-6">
        <span className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </span>
        <span className="relative flex justify-center text-xs uppercase tracking-wider text-muted-foreground py-[9px]">
          <span className="bg-card px-2">or continue with</span>
        </span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!initialEmail}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {message && (
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
        )}
        <Button type="submit" disabled={anyLoading} className="w-full">
          {loading && (
            <span
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground py-[5px]">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
