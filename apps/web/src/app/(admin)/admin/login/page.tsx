import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { ConfigError } from "@/app/(app)/config-error";
import { AdminLoginForm } from "./admin-login-form";

export default async function AdminLoginPage() {
  let admin;
  try {
    admin = await getAdminUser();
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
  if (admin) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Admin sign in</h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}
