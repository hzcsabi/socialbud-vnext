"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { RenameAccountButton } from "./rename-account-button";
import { SetAccountParentButton } from "./set-account-parent-button";
import { DeleteAccountButton } from "./delete-account-button";
import { AddMemberToAccountButton } from "./add-member-to-account-button";
import type { AccountListEntry, UserListEntry } from "./actions";
import { cn } from "@/lib/utils";

type Props = {
  accountId: string;
  accountName: string;
  currentParentId: string | null;
  accounts: AccountListEntry[];
  /** If true, this is a parent account and cannot be assigned under another (Set parent / Move hidden). */
  hasSubaccounts?: boolean;
  /** All users (for Add user). When provided with memberUserIds, "Add user" is shown. */
  users?: UserListEntry[];
  /** User IDs already in this account (for Add user). */
  memberUserIds?: string[];
};

export function AccountRowActionsMenu({
  accountId,
  accountName,
  currentParentId,
  accounts,
  hasSubaccounts = false,
  users = [],
  memberUserIds = [],
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [setParentOpen, setSetParentOpen] = useState(false);
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
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => closeAnd(() => setRenameOpen(true))}
          >
            Rename
          </button>
          {users.length > 0 && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => closeAnd(() => setAddMemberOpen(true))}
            >
              Add user
            </button>
          )}
          {!hasSubaccounts && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => closeAnd(() => setSetParentOpen(true))}
            >
              Set parent
            </button>
          )}
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
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">Actions</span>
        <span aria-hidden>...</span>
      </Button>
      {typeof document !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}

      <RenameAccountButton
        accountId={accountId}
        currentName={accountName}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      {users.length > 0 && (
        <AddMemberToAccountButton
          accountId={accountId}
          accountName={accountName}
          users={users}
          memberUserIds={memberUserIds}
          open={addMemberOpen}
          onOpenChange={setAddMemberOpen}
        />
      )}
      {!hasSubaccounts && (
        <SetAccountParentButton
          accountId={accountId}
          accountName={accountName}
          currentParentId={currentParentId}
          accounts={accounts}
          open={setParentOpen}
          onOpenChange={setSetParentOpen}
        />
      )}
      <DeleteAccountButton
        accountId={accountId}
        accountName={accountName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
