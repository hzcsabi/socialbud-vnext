import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "../(app)/config-error";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInvitationByToken } from "@/app/invite/accept/actions";
import { SignupForm } from "./signup-form";

type Props = {
  searchParams: Promise<{ invitation?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
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
  if (user) redirect("/select-account");

  const params = await searchParams;
  const invitationToken = params.invitation?.trim() ?? "";
  let initialEmail: string | undefined;
  if (invitationToken) {
    const inv = await getInvitationByToken(invitationToken);
    if (inv.valid && inv.email) initialEmail = inv.email;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm
            initialEmail={initialEmail}
            invitationToken={invitationToken || undefined}
          />
        </CardContent>
      </Card>
    </main>
  );
}
