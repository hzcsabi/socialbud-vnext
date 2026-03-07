"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { renameAccountAsAdmin } from "./actions";

type Props = {
  accountId: string;
  currentName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function RenameAccountButton({
  accountId,
  currentName,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const showTrigger = !isControlled;

  useEffect(() => {
    if (open) {
      setName(currentName);
      setMessage(null);
    }
  }, [open, currentName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setMessage(null);
    const result = await renameAccountAsAdmin(accountId, trimmed);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {showTrigger &&
        (trigger != null ? (
          <div onClick={() => setOpen(true)}>{trigger}</div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={loading}>
            Rename
          </Button>
        ))}
      <AlertDialog open={open} onOpenChange={(v) => setOpen(v === true)}>
        <AlertDialogContent>
          <form onSubmit={handleSubmit}>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename account</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for this account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <label className="sr-only" htmlFor="rename-account-input">
                Account name
              </label>
              <Input
                id="rename-account-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Account name"
                disabled={loading}
                autoFocus
              />
            </div>
            {message && (
              <p
                className={
                  message.type === "error"
                    ? "text-sm text-destructive"
                    : "text-sm text-green-600 dark:text-green-400"
                }
              >
                {message.text}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={loading}>
                Cancel
              </AlertDialogCancel>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
