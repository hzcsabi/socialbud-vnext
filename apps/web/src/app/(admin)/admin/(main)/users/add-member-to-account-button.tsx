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
import { addMemberToAccountAsAdmin } from "./actions";
import type { UserListEntry, MemberRole } from "./actions";

const ROLES: MemberRole[] = ["member", "admin", "owner"];

function roleLabel(role: MemberRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    default:
      return role;
  }
}

type Props = {
  accountId: string;
  accountName: string;
  users: UserListEntry[];
  memberUserIds: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddMemberToAccountButton({
  accountId,
  accountName,
  users,
  memberUserIds,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<MemberRole>("member");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const memberIdSet = useMemo(() => new Set(memberUserIds), [memberUserIds]);
  const availableUsers = useMemo(
    () => users.filter((u) => !memberIdSet.has(u.id)).sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "")),
    [users, memberIdSet]
  );

  useEffect(() => {
    if (open) {
      setSelectedUserId(availableUsers.length > 0 ? availableUsers[0].id : "");
      setSelectedRole("member");
      setMessage(null);
    }
  }, [open, availableUsers]);

  async function handleAdd() {
    if (!selectedUserId) return;
    setLoading(true);
    setMessage(null);
    const result = await addMemberToAccountAsAdmin(accountId, selectedUserId, selectedRole);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => setOpen(v === true)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add user</AlertDialogTitle>
          <AlertDialogDescription>
            Add a user to &quot;{accountName}&quot;. Select the user and role.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="add-member-user-select" className="mb-1 block text-sm font-medium">
              User
            </label>
            <select
              id="add-member-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={loading || availableUsers.length === 0}
            >
              {availableUsers.length === 0 ? (
                <option value="">No users available to add</option>
              ) : (
                availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email ?? u.id} {u.name ? `(${u.name})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="add-member-role-select" className="mb-1 block text-sm font-medium">
              Role
            </label>
            <select
              id="add-member-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={loading}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
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
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={loading || !selectedUserId || availableUsers.length === 0}
            onClick={(e) => {
              e.preventDefault();
              handleAdd();
            }}
          >
            {loading ? "Adding…" : "Add user"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
