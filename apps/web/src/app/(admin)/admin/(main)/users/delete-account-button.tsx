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
import { deleteAccountAsAdmin } from "./actions";
import { cn } from "@/lib/utils";

type Props = {
  accountId: string;
  accountName: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Message = { type: "success" | "error"; text: string } | null;

export function DeleteAccountButton({
  accountId,
  accountName,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleConfirm() {
    setLoading(true);
    setMessage(null);
    const result = await deleteAccountAsAdmin(accountId, accountName);
    setLoading(false);
    setOpen(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "success", text: "Account deleted." });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={(value) => setOpen(value === true)}>
        {!isControlled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={loading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        )}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete the account {accountName ? `"${accountName}"` : ""}? Members, invitations, and billing links will be removed. Child accounts will become top-level. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {message ? (
        <p
          role="alert"
          className={cn(
            "text-xs max-w-[220px] text-right",
            message.type === "error" && "text-destructive",
            message.type === "success" && "text-green-600 dark:text-green-400"
          )}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
