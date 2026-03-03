"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createInvitation,
  revokeInvitation,
  resendInvitation,
  type MemberRow,
  type PendingInvitationRow,
} from "./actions";

type Props = {
  organization: { id: string; name: string };
  members: MemberRow[];
  pendingInvitations: PendingInvitationRow[];
};

export function UsersTabContent({
  organization,
  members,
  pendingInvitations,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);
    const result = await createInvitation(organization.id, email);
    setInviteLoading(false);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    await revokeInvitation(invitationId, organization.id);
    setRevokingId(null);
    router.refresh();
  }

  async function handleResend(invitationId: string) {
    setResendingId(invitationId);
    await resendInvitation(invitationId, organization.id);
    setResendingId(null);
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite by email</CardTitle>
          <CardDescription>
            Send an invitation to join {organization.name}. They will receive an email with a link to sign up or log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-1 min-w-[200px] flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteLoading}
              />
            </label>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? "Sending…" : "Send invitation"}
            </Button>
          </form>
          {inviteError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {inviteError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People who have access to this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {m.display_name ? `${m.display_name} · ${m.email ?? m.user_id}` : m.email ?? m.user_id}
                  </span>
                  <span className="shrink-0 text-muted-foreground capitalize">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
          <CardDescription>
            Invitations that have not been accepted yet. You can revoke or resend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border">
              {pendingInvitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{inv.email}</span>
                    <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Pending invite
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={resendingId !== null}
                      onClick={() => handleResend(inv.id)}
                    >
                      {resendingId === inv.id ? "Sending…" : "Resend"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokingId !== null}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(inv.id)}
                    >
                      {revokingId === inv.id ? "Revoking…" : "Revoke"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
