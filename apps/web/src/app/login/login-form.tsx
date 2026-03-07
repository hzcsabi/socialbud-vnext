"use client";

import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { nextUrl?: string };

export function LoginForm({ nextUrl }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(nextUrl ?? "/select-account");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = nextUrl
      ? `${origin}/auth/oauth-callback?next=${encodeURIComponent(nextUrl)}`
      : `${origin}/auth/oauth-callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) window.location.href = data.url;
    else setGoogleLoading(false);
  }

  const anyLoading = loading || googleLoading;

  return (
    <div className="mt-4 space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={anyLoading}
        onClick={handleGoogleSignIn}
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
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
        <Button type="submit" disabled={anyLoading} className="w-full">
          {loading && (
            <span
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground py-[5px]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
