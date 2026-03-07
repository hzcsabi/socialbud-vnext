import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvitationByToken, acceptInvitation } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

function InvalidInviteView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold">Invalid or expired invitation</h1>
        <p className="text-muted-foreground">
          This invitation link is invalid or has expired. Ask the person who invited you to send a new one.
        </p>
        <Button asChild>
          <Link href="/">Go to home</Link>
        </Button>
      </div>
    </main>
  );
}

export default async function InviteAcceptPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token ?? "";

  let invitation: Awaited<ReturnType<typeof getInvitationByToken>>;
  let user: { email?: string | null } | null = null;
  try {
    invitation = await getInvitationByToken(token);
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return <InvalidInviteView />;
  }

  if (!invitation.valid) {
    return <InvalidInviteView />;
  }

  if (user) {
    const userEmail = (user.email ?? "").toLowerCase();
    const inviteEmail = (invitation.email ?? "").toLowerCase();
    if (userEmail === inviteEmail) {
      const result = await acceptInvitation(token);
      if (!result.error) {
        redirect("/app");
      }
      return (
        <main className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-destructive">{result.error}</p>
            <Button asChild>
              <Link href="/app">Go to app</Link>
            </Button>
          </div>
        </main>
      );
    }
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-semibold">Wrong account</h1>
          <p className="text-muted-foreground">
            This invitation was sent to <strong>{invitation.email}</strong>. Please log in with that account to accept, or sign up with that email.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/login?next=${encodeURIComponent(`/invite/accept?token=${encodeURIComponent(token)}`)}`}>
                Log in
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/signup?invitation=${encodeURIComponent(token)}`}>Sign up</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-xl font-semibold">You&apos;re invited</h1>
        <p className="text-muted-foreground">
          You&apos;re invited to join <strong>{invitation.accountName}</strong>. Sign up or log in with <strong>{invitation.email}</strong> to accept.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={`/signup?invitation=${encodeURIComponent(token)}`}>Sign up</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?next=${encodeURIComponent(`/invite/accept?token=${encodeURIComponent(token)}`)}`}>
              Log in
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
