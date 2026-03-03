import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "@/app/(app)/config-error";
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
      <div className="w-full max-w-sm rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Set your password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Choose a password to sign in to your account.
        </p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
