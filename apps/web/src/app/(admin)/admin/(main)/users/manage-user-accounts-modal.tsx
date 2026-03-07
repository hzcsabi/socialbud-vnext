"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { addMemberToAccountAsAdmin, removeMemberFromAccountAsAdmin } from "./actions";
import type { AccountListEntry } from "./actions";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  userDisplay: string;
  currentAccountIds: string[];
  accounts: AccountListEntry[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ManageUserAccountsModal({
  userId,
  userDisplay,
  currentAccountIds,
  accounts,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const currentSet = useMemo(() => new Set(currentAccountIds), [currentAccountIds]);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(currentAccountIds));
      setError(null);
      setSearch("");
    }
  }, [open, currentAccountIds]);

  const toggle = (accountId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  async function handleSave() {
    setLoading(true);
    setError(null);
    const toAdd = [...selectedIds].filter((id) => !currentSet.has(id));
    const toRemove = [...currentSet].filter((id) => !selectedIds.has(id));

    for (const accountId of toRemove) {
      const result = await removeMemberFromAccountAsAdmin(accountId, userId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }
    for (const accountId of toAdd) {
      const result = await addMemberToAccountAsAdmin(accountId, userId, "member");
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.name.localeCompare(b.name)),
    [accounts]
  );

  const searchLower = search.trim().toLowerCase();
  const filteredAccounts = useMemo(
    () =>
      !searchLower
        ? sortedAccounts
        : sortedAccounts.filter(
            (a) =>
              a.name.toLowerCase().includes(searchLower) ||
              (a.parentAccountName?.toLowerCase().includes(searchLower) ?? false)
          ),
    [sortedAccounts, searchLower]
  );

  return (
    <AlertDialog open={open} onOpenChange={(v) => setOpen(v === true)}>
      <AlertDialogContent className="max-h-[85vh] flex flex-col max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Manage accounts</AlertDialogTitle>
          <AlertDialogDescription>
            Configure which accounts <span className="font-medium text-foreground">{userDisplay}</span> has access to. Check the accounts this user should be a member of.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Input
            type="search"
            placeholder="Filter accounts by name or parent…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            aria-label="Filter accounts"
          />
        </div>
        <div className="min-h-0 overflow-y-auto border border-border rounded-md p-2 space-y-1 max-h-60">
          {sortedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No accounts.</p>
          ) : filteredAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No accounts match the filter.</p>
          ) : (
            filteredAccounts.map((account) => (
              <label
                key={account.id}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-muted/50",
                  selectedIds.has(account.id) && "bg-muted/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(account.id)}
                  onChange={() => toggle(account.id)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="font-medium">{account.name}</span>
                {account.parentAccountName && (
                  <span className="text-muted-foreground text-xs">
                    ↑ {account.parentAccountName}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button type="button" disabled={loading} onClick={handleSave}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
