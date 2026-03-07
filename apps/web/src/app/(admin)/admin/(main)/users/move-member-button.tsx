"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { moveMemberAsAdmin } from "./actions";
import type { AccountListEntry } from "./actions";

type Props = {
  userId: string;
  email: string;
  fromAccountId: string;
  fromAccountName: string;
  accounts: AccountListEntry[];
};

export function MoveMemberButton({ userId, email, fromAccountId, fromAccountName, accounts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const targetAccounts = accounts.filter((a) => a.id !== fromAccountId);

  async function handleConfirm() {
    if (!selectedId) return;
    setLoading(true);
    setMessage(null);
    const result = await moveMemberAsAdmin(userId, fromAccountId, selectedId);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setOpen(false);
    setMessage({ type: "success", text: "Member moved." });
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => {
          setSelectedId("");
          setMessage(null);
          setOpen(true);
        }}
        disabled={loading || targetAccounts.length === 0}
      >
        Move
      </Button>
      <AlertDialog open={open} onOpenChange={(v) => setOpen(v === true)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move member</AlertDialogTitle>
            <AlertDialogDescription>
              Move {email} from &quot;{fromAccountName}&quot; to another account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="sr-only" htmlFor="move-member-select">
              Target account
            </label>
            <select
              id="move-member-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select account…</option>
              {targetAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-green-600 dark:text-green-400"}>
              {message.text}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={loading || !selectedId}
            >
              {loading ? "Moving…" : "Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
