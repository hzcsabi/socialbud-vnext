import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "../(app)/config-error";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { ClearLoginErrorCookie } from "./clear-login-error";

function isAllowedRedirect(path: string): boolean {
  return /^\/[^:]*$/.test(path ?? "");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    if (err instanceof Error && err.message === "Missing Supabase env vars") {
      return (
        <main className="flex min-h-screen items-center justify-center p-4">
          <ConfigError />
        </main>
      );
    }
    throw err;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const params = await searchParams;
    const nextPath = params.next?.trim();
    const destination = nextPath && isAllowedRedirect(nextPath) ? nextPath : "/select-account";
    redirect(destination);
  }

  const params = await searchParams;
  const nextUrl = params.next?.trim() && isAllowedRedirect(params.next!.trim()) ? params.next!.trim() : undefined;
  const cookieStore = await cookies();
  const loginError = cookieStore.get("login_error")?.value;
  const showNoUserError = loginError === "no_user_found";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ClearLoginErrorCookie show={showNoUserError} />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
          {showNoUserError && (
            <p className="text-sm text-destructive" role="alert">
              No user found.
            </p>
          )}
          {params.error && (
            <p className="text-sm text-destructive" role="alert">
              {decodeURIComponent(params.error)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <LoginForm nextUrl={nextUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
