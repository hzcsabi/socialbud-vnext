import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "@/app/(app)/config-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage() {
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
  if (!user) redirect("/login?error=session_required");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Choose a password to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
