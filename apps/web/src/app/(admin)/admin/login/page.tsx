import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminUser } from "@/lib/admin";
import { ConfigError } from "@/app/(app)/config-error";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "./admin-login-form";
import { ClearLoginErrorCookie } from "@/app/login/clear-login-error";

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
  const cookieStore = await cookies();
  const loginError = cookieStore.get("login_error")?.value;
  const showNoUserError = loginError === "no_user_found";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ClearLoginErrorCookie show={showNoUserError} />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Admin sign in</CardTitle>
          {showNoUserError && (
            <p className="text-sm text-destructive" role="alert">
              No user found.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
