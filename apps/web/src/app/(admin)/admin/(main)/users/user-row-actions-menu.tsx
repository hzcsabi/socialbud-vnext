"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
import { MoveMemberButton } from "./move-member-button";
import { DeleteUserButton } from "./delete-user-button";
import { suspendUserAsAdmin, setAccountMemberRoleAsAdmin } from "./actions";
import type { AccountListEntry, MemberRole } from "./actions";
import { cn } from "@/lib/utils";

const ROLES: MemberRole[] = ["owner", "admin", "member"];

function roleLabel(role: MemberRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "User";
    default:
      return role;
  }
}

type Props = {
  userId: string;
  email: string | null;
  disabled?: boolean;
  fromAccountId?: string;
  fromAccountName?: string;
  memberRole?: MemberRole;
  accounts?: AccountListEntry[];
};

export function UserRowActionsMenu({
  userId,
  email,
  disabled,
  fromAccountId,
  fromAccountName,
  memberRole,
  accounts = [],
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [changeRoleLoading, setChangeRoleLoading] = useState(false);
  const [changeRoleError, setChangeRoleError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>("member");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    setDropdownRect(rect ?? null);
    setMenuOpen(true);
  };

  const closeAnd = (openDialog: () => void) => {
    setMenuOpen(false);
    openDialog();
  };

  async function handleSuspendConfirm() {
    setSuspendLoading(true);
    const result = await suspendUserAsAdmin(userId);
    setSuspendLoading(false);
    setSuspendOpen(false);
    if (result.error) return;
    router.refresh();
  }

  async function handleChangeRoleConfirm() {
    if (!fromAccountId) return;
    setChangeRoleLoading(true);
    setChangeRoleError(null);
    const result = await setAccountMemberRoleAsAdmin(fromAccountId, userId, selectedRole);
    setChangeRoleLoading(false);
    if (result.error) {
      setChangeRoleError(result.error);
      return;
    }
    setChangeRoleOpen(false);
    router.refresh();
  }

  const showMove = fromAccountId != null && fromAccountName != null && accounts.length > 0;
  const showChangeRole = fromAccountId != null && memberRole != null;

  const DROPDOWN_ESTIMATED_HEIGHT = 200;
  const spaceBelow = dropdownRect ? window.innerHeight - dropdownRect.bottom - 4 : 0;
  const openUpward = dropdownRect ? spaceBelow < DROPDOWN_ESTIMATED_HEIGHT : false;

  const dropdownContent = menuOpen && dropdownRect && (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100] min-w-[10rem] rounded-md border border-border bg-popover py-1 shadow-md",
        "text-popover-foreground"
      )}
      style={
        openUpward
          ? { bottom: window.innerHeight - dropdownRect.top + 4, right: window.innerWidth - dropdownRect.right }
          : { top: dropdownRect.bottom + 4, right: window.innerWidth - dropdownRect.right }
      }
      role="menu"
    >
      {showMove && (
        <button
          type="button"
          role="menuitem"
          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
          onClick={() => closeAnd(() => setMoveOpen(true))}
        >
          Move
        </button>
      )}
      {showChangeRole && (
        <button
          type="button"
          role="menuitem"
          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
          onClick={() => {
            closeAnd(() => {
              setSelectedRole(memberRole ?? "member");
              setChangeRoleError(null);
              setChangeRoleOpen(true);
            });
          }}
        >
          Change role
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
        onClick={() => closeAnd(() => setSuspendOpen(true))}
      >
        Suspend
      </button>
      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
        onClick={() => closeAnd(() => setDeleteOpen(true))}
      >
        Delete
      </button>
    </div>
  );

  return (
    <div className="relative flex items-center justify-end">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
        disabled={disabled}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">Actions</span>
        <span aria-hidden>...</span>
      </Button>
      {typeof document !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}

      {showMove && fromAccountId && fromAccountName && (
        <MoveMemberButton
          userId={userId}
          email={email ?? ""}
          fromAccountId={fromAccountId}
          fromAccountName={fromAccountName}
          accounts={accounts}
          open={moveOpen}
          onOpenChange={setMoveOpen}
        />
      )}
      <AlertDialog open={changeRoleOpen} onOpenChange={(v) => setChangeRoleOpen(v === true)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role</AlertDialogTitle>
            <AlertDialogDescription>
              Set the role for this member in {fromAccountName ?? "this account"}. Owner and Admin can manage members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="sr-only" htmlFor="change-role-select">
              Role
            </label>
            <select
              id="change-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
          {changeRoleError && (
            <p className="text-sm text-destructive">{changeRoleError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeRoleLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={changeRoleLoading}
              onClick={(e) => {
                e.preventDefault();
                handleChangeRoleConfirm();
              }}
            >
              {changeRoleLoading ? "Saving…" : "Save"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={suspendOpen} onOpenChange={(v) => setSuspendOpen(v === true)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend user</AlertDialogTitle>
            <AlertDialogDescription>
              Suspend this user? They will not be able to sign in until unsuspended. Their data is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSuspendConfirm();
              }}
              disabled={suspendLoading}
            >
              {suspendLoading ? "Suspending…" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteUserButton
        userId={userId}
        email={email}
        disabled={disabled}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
