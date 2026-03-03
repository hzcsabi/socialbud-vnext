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
import { deleteUserAsAdmin } from "./actions";
import { cn } from "@/lib/utils";

type Props = { userId: string; email: string | null; disabled?: boolean };

type Message = { type: "success" | "error" | "warning"; text: string } | null;

export function DeleteUserButton({ userId, email, disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleConfirm() {
    setLoading(true);
    setMessage(null);
    const result = await deleteUserAsAdmin(userId, email);
    setLoading(false);
    setOpen(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    if (result.warning) {
      setMessage({ type: "warning", text: result.warning });
    } else {
      setMessage({ type: "success", text: "User deleted." });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={disabled || loading}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {loading ? "Deleting…" : "Delete"}
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this user? They will receive an email notification if email is configured. This cannot be undone.
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
            message.type === "warning" && "text-amber-600 dark:text-amber-400",
            message.type === "success" && "text-green-600 dark:text-green-400"
          )}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}