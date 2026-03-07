"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
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
import { setAccountParentAsAdmin } from "./actions";
import type { AccountListEntry } from "./actions";

function getDescendantIds(accountId: string, accounts: AccountListEntry[]): Set<string> {
  const descendantIds = new Set<string>();
  let current = [accountId];
  while (current.length > 0) {
    const children = accounts.filter(
      (a) => a.parent_account_id != null && current.includes(a.parent_account_id)
    );
    const nextIds = children.map((a) => a.id).filter((id) => !descendantIds.has(id));
    nextIds.forEach((id) => descendantIds.add(id));
    current = nextIds;
  }
  return descendantIds;
}

type Props = {
  accountId: string;
  accountName: string;
  currentParentId: string | null;
  accounts: AccountListEntry[];
};

export function SetAccountParentButton({ accountId, accountName, currentParentId, accounts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const descendantIds = useMemo(() => getDescendantIds(accountId, accounts), [accountId, accounts]);
  const validParents = useMemo(
    () => accounts.filter((a) => a.id !== accountId && !descendantIds.has(a.id)),
    [accounts, accountId, descendantIds]
  );

  async function handleConfirm() {
    const value = selectedId === "" ? null : selectedId;
    setLoading(true);
    setMessage(null);
    const result = await setAccountParentAsAdmin(accountId, value);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setOpen(false);
    setMessage({ type: "success", text: "Parent updated." });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedId(currentParentId ?? "");
          setMessage(null);
          setOpen(true);
        }}
        disabled={loading}
      >
        Set parent
      </Button>
      <AlertDialog open={open} onOpenChange={(v) => setOpen(v === true)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set parent account</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a parent for &quot;{accountName}&quot;. Child accounts will remain; only the hierarchy changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="sr-only" htmlFor="set-parent-select">
              Parent account
            </label>
            <select
              id="set-parent-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— No parent (top-level)</option>
              {validParents.map((a) => (
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
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirm(); }} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {message && !open && (
        <p className={message.type === "error" ? "text-xs text-destructive" : "text-xs text-green-600 dark:text-green-400"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
