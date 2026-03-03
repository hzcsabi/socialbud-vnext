import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "../(app)/config-error";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
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
  if (user) redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
