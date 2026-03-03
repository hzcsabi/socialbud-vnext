import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { ConfigError } from "@/app/(app)/config-error";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Admin sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
