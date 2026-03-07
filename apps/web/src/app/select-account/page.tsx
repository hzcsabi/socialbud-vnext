import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ensureCurrentUserAccount,
  listUserAccounts,
  setSelectedAccount,
} from "@/lib/account";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfigError } from "@/app/(app)/config-error";
import { SelectAccountForm } from "./select-account-form";

export default async function SelectAccountPage() {
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
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, deleted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.deleted_at) redirect("/api/auth/signout-deleted?redirect=%2Flogin");
  if (!profile?.display_name?.trim()) redirect("/onboarding");

  await ensureCurrentUserAccount();
  const accounts = await listUserAccounts();
  if (accounts.length === 0) redirect("/app");
  if (accounts.length === 1) {
    await setSelectedAccount(accounts[0]!.id, true);
    return null; // redirect() throws
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Choose an account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the account you want to use.
          </p>
        </CardHeader>
        <CardContent>
          <SelectAccountForm accounts={accounts} />
        </CardContent>
      </Card>
    </main>
  );
}
