"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteUserButton } from "./delete-user-button";
import { AccountRowActionsMenu } from "./account-row-actions-menu";
import { UserRowActionsMenu } from "./user-row-actions-menu";
import type { UserListEntry, AccountListEntry, UserStatus, MemberRole } from "./actions";

const PAGE_SIZE = 50;

function statusLabel(status: UserStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "banned":
      return "Banned";
    case "deleted":
      return "Deleted";
    default:
      return status;
  }
}

function statusClass(status: UserStatus) {
  switch (status) {
    case "active":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "suspended":
    case "banned":
      return "bg-destructive/15 text-destructive";
    case "deleted":
      return "bg-muted text-muted-foreground";
    default:
      return "";
  }
}

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

function roleClass(role: MemberRole) {
  switch (role) {
    case "owner":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "admin":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    case "member":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function matchesSearch(text: string | null, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

type MainTab = "users" | "accounts";
type AccountTab = "individual" | "parent";

type Props = {
  users: UserListEntry[];
  accounts: AccountListEntry[];
  currentUserId: string | null;
  /** When true, deleted users are included in the list (from ?showDeleted=1). */
  showDeleted?: boolean;
  error?: string;
  accountsError?: string;
};

export function AdminUsersContent({
  users,
  accounts,
  currentUserId,
  showDeleted = false,
  error,
  accountsError,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("accounts");
  const [accountTab, setAccountTab] = useState<AccountTab>("individual");
  const [userPage, setUserPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(new Set());

  function setShowDeleted(checked: boolean) {
    const url = checked ? `${pathname}?showDeleted=1` : pathname;
    router.push(url);
  }

  useEffect(() => {
    setAccountPage(1);
  }, [accountTab]);

  const toggleParentExpanded = (parentId: string) => {
    setExpandedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const toggleMembersExpanded = (accountId: string) => {
    setExpandedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      if (matchesSearch(u.name, q) || matchesSearch(u.email, q) || matchesSearch(u.website, q))
        return true;
      if (u.accounts.some((a) => matchesSearch(a.accountName, q) || matchesSearch(a.parentAccountName, q)))
        return true;
      return false;
    });
  }, [users, search]);

  const individualAccounts = useMemo(
    () => accounts.filter((a) => !a.hasSubaccounts),
    [accounts]
  );
  const parentAccounts = useMemo(
    () => accounts.filter((a) => a.hasSubaccounts),
    [accounts]
  );

  const filterAccounts = (list: AccountListEntry[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        matchesSearch(a.name, q) ||
        matchesSearch(a.parentAccountName, q) ||
        a.memberEmails.some((e) => matchesSearch(e, q))
    );
  };

  const filteredIndividualAccounts = useMemo(
    () => filterAccounts(individualAccounts),
    [individualAccounts, search]
  );
  const filteredParentAccounts = useMemo(
    () => filterAccounts(parentAccounts),
    [parentAccounts, search]
  );

  const subaccountsByParentId = useMemo(() => {
    const map = new Map<string, AccountListEntry[]>();
    const q = search.trim().toLowerCase();
    for (const a of accounts) {
      const parentId = a.parent_account_id;
      if (!parentId) continue;
      if (q && !matchesSearch(a.name, q) && !matchesSearch(a.parentAccountName, q) && !a.memberEmails.some((e) => matchesSearch(e, q)))
        continue;
      const list = map.get(parentId) ?? [];
      list.push(a);
      map.set(parentId, list);
    }
    return map;
  }, [accounts, search]);

  const currentAccounts =
    accountTab === "individual" ? filteredIndividualAccounts : filteredParentAccounts;

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const effectiveUserPage = Math.min(Math.max(1, userPage), totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (effectiveUserPage - 1) * PAGE_SIZE,
    effectiveUserPage * PAGE_SIZE
  );

  const totalAccountPages = Math.max(1, Math.ceil(currentAccounts.length / PAGE_SIZE));
  const effectiveAccountPage = Math.min(Math.max(1, accountPage), totalAccountPages);
  const paginatedAccounts = currentAccounts.slice(
    (effectiveAccountPage - 1) * PAGE_SIZE,
    effectiveAccountPage * PAGE_SIZE
  );

  return (
    <div>
      <div
        className="mt-4 flex gap-0 border-b border-border"
        role="tablist"
        aria-label="Section"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "accounts"}
          onClick={() => setMainTab("accounts")}
          className={cn(
            "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mainTab === "accounts"
              ? "border-border bg-background text-foreground -mb-px"
              : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Accounts ({filteredIndividualAccounts.length + filteredParentAccounts.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "users"}
          onClick={() => setMainTab("users")}
          className={cn(
            "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mainTab === "users"
              ? "border-border bg-background text-foreground -mb-px"
              : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Users ({filteredUsers.length})
        </button>
      </div>

      <div className="mt-4 w-full">
        <Input
          type="search"
            placeholder="Filter users and accounts by name, email, website…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            aria-label="Filter users and accounts"
        />
      </div>

      {mainTab === "users" && (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>{showDeleted ? "Deleted users" : "All users"}</CardTitle>
            <label className="flex items-center gap-2 text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="h-4 w-4 rounded border-border"
                aria-label="Show deleted users only"
              />
              Show deleted users only
            </label>
          </div>
          {error ? (
            <p className="text-sm text-destructive mt-2">
              {error}. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your env.
            </p>
          ) : null}
        </CardHeader>
        {!error && (
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {users.length === 0
                  ? showDeleted
                    ? "No deleted users."
                    : "No users yet."
                  : "No users match the search."}
              </p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Accounts</th>
                      <th className="px-4 py-3 text-left font-medium">Website</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{u.name ?? "—"}</td>
                        <td className="px-4 py-3">{u.email ?? "—"}</td>
                        <td className="px-4 py-3 align-top">
                          {u.accounts.length === 0 ? (
                            "—"
                          ) : (
                            <ul className="space-y-1.5">
                              {u.accounts.map((account) => (
                                <li key={account.accountId} className="text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMainTab("accounts");
                                      setAccountTab(account.hasSubaccounts ? "parent" : "individual");
                                      setSearch(account.accountName);
                                      setAccountPage(1);
                                    }}
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                  >
                                    {account.accountName}
                                  </button>
                                  <span className={cn("ml-1 rounded px-1.5 py-0.5 capitalize", roleClass(account.role as MemberRole))}>
                                    {roleLabel(account.role as MemberRole)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-4 py-3">{u.website ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}
                          >
                            {statusLabel(u.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <UserRowActionsMenu
                            userId={u.id}
                            email={u.email}
                            status={u.status}
                            disabled={u.id === currentUserId || u.status === "deleted"}
                            accounts={accounts}
                            currentAccountIds={u.accounts.map((a) => a.accountId)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalUserPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Page {effectiveUserPage} of {totalUserPages} ({filteredUsers.length} users)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={effectiveUserPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                      disabled={effectiveUserPage >= totalUserPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        )}
      </Card>
      )}

      {mainTab === "accounts" && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          {accountsError ? (
            <p className="text-sm text-destructive">{accountsError}</p>
          ) : null}
        </CardHeader>
        {!accountsError && (
          <CardContent>
            <div
              className="mb-4 flex gap-0 border-b border-border"
              role="tablist"
              aria-label="Account type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "individual"}
                onClick={() => setAccountTab("individual")}
                className={cn(
                  "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  accountTab === "individual"
                    ? "border-border bg-background text-foreground -mb-px"
                    : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Accounts ({filteredIndividualAccounts.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "parent"}
                onClick={() => setAccountTab("parent")}
                className={cn(
                  "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  accountTab === "parent"
                    ? "border-border bg-background text-foreground -mb-px"
                    : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Parent accounts ({filteredParentAccounts.length})
              </button>
            </div>
            {currentAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {accountTab === "individual"
                  ? individualAccounts.length === 0
                    ? "No individual accounts yet."
                    : "No individual accounts match the search."
                  : parentAccounts.length === 0
                    ? "No parent accounts yet."
                    : "No parent accounts match the search."}
              </p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-8 px-2 py-3" aria-label="Expand" />
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Parent</th>
                      <th className="px-4 py-3 text-left font-medium">Members</th>
                      <th className="px-4 py-3 text-left font-medium">Subscription</th>
                      <th className="px-4 py-3 text-left font-medium">Plan</th>
                      <th className="px-4 py-3 text-left font-medium">Billing</th>
                      {accountTab === "parent" && (
                        <th className="px-4 py-3 text-left font-medium">Subaccounts</th>
                      )}
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAccounts.map((a) => {
                      const subaccounts = accountTab === "parent" ? (subaccountsByParentId.get(a.id) ?? []) : [];
                      const parentExpanded = expandedParentIds.has(a.id);
                      const membersExpanded = expandedMemberIds.has(a.id);
                      const showExpand =
                        (accountTab === "parent" && (a.hasSubaccounts || a.memberCount > 0)) ||
                        (accountTab === "individual" && a.memberCount > 0);
                      const isExpanded = accountTab === "parent" ? parentExpanded : membersExpanded;
                      return (
                        <React.Fragment key={a.id}>
                          <tr className="border-b border-border last:border-0">
                            <td className="w-8 px-2 py-3">
                              {showExpand ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    accountTab === "parent"
                                      ? toggleParentExpanded(a.id)
                                      : toggleMembersExpanded(a.id)
                                  }
                                  aria-expanded={isExpanded}
                                  aria-label={
                                    accountTab === "parent"
                                      ? isExpanded
                                        ? "Collapse members and sub-accounts"
                                        : "Expand members and sub-accounts"
                                      : isExpanded
                                        ? "Collapse members"
                                        : "Expand members"
                                  }
                                  className="flex size-6 items-center justify-center rounded hover:bg-muted"
                                >
                                  <span className="text-muted-foreground" aria-hidden>
                                    {isExpanded ? "▼" : "▶"}
                                  </span>
                                </button>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 font-medium">{a.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {a.parentAccountName ?? "—"}
                            </td>
                            <td className="px-4 py-3">{a.memberCount}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {a.subscriptionStatus ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {a.plan ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {a.billingResponsible ?? "—"}
                            </td>
                            {accountTab === "parent" && (
                              <td className="px-4 py-3">
                                {a.subaccountCount > 0 ? a.subaccountCount : "—"}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right">
                              <AccountRowActionsMenu
                                accountId={a.id}
                                accountName={a.name}
                                currentParentId={a.parent_account_id}
                                accounts={accounts}
                                hasSubaccounts={a.hasSubaccounts}
                                users={users}
                                memberUserIds={a.members.map((m) => m.userId)}
                              />
                            </td>
                          </tr>
                          {(accountTab === "individual" && membersExpanded) || (accountTab === "parent" && parentExpanded && a.memberCount > 0) ? (
                            <tr className="border-b border-border bg-muted/30 last:border-0">
                              <td className="w-8 px-2 py-3" />
                              <td colSpan={accountTab === "parent" ? 9 : 8} className="px-4 py-3 pl-10">
                                {a.members.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">No members</span>
                                ) : (
                                  <ul className="mt-2 space-y-2.5">
                                    {a.members.map((m) => (
                                      <li
                                        key={m.userId}
                                        className="flex items-center justify-between gap-4 text-sm text-foreground"
                                      >
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                          <span className="shrink-0">{m.name ?? "—"}</span>
                                          <span className="min-w-0 truncate">{m.email || m.userId}</span>
                                          <span className={cn("inline-flex shrink-0 rounded px-2 py-0.5 text-xs font-medium", roleClass(m.role))}>
                                            {roleLabel(m.role)}
                                          </span>
                                          <span
                                            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(m.status)}`}
                                          >
                                            {statusLabel(m.status)}
                                          </span>
                                        </div>
                                        <div className="shrink-0">
                                          <UserRowActionsMenu
                                            userId={m.userId}
                                            email={m.email || m.userId}
                                            status={m.status}
                                            fromAccountId={a.id}
                                            fromAccountName={a.name}
                                            memberRole={m.role}
                                            accounts={accounts}
                                            currentAccountIds={
                                              users.find((uu) => uu.id === m.userId)?.accounts.map((ac) => ac.accountId) ?? [a.id]
                                            }
                                            disabled={m.userId === currentUserId}
                                          />
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                            </tr>
                          ) : null}
                          {accountTab === "parent" && parentExpanded && subaccounts.map((sub) => (
                            <tr key={sub.id} className="border-b border-border bg-muted/30 last:border-0">
                              <td className="w-8 px-2 py-3" />
                              <td className="px-4 py-3 pl-10 font-medium text-muted-foreground">
                                ↳ {sub.name}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sub.parentAccountName ?? "—"}
                              </td>
                              <td className="px-4 py-3">{sub.memberCount}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sub.subscriptionStatus ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sub.plan ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sub.billingResponsible ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">—</td>
                              <td className="px-4 py-3 text-right">
                                <AccountRowActionsMenu
                                  accountId={sub.id}
                                  accountName={sub.name}
                                  currentParentId={sub.parent_account_id}
                                  accounts={accounts}
                                  hasSubaccounts={sub.hasSubaccounts}
                                  users={users}
                                  memberUserIds={sub.members.map((m) => m.userId)}
                                />
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalAccountPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Page {effectiveAccountPage} of {totalAccountPages} ({currentAccounts.length} accounts)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAccountPage((p) => Math.max(1, p - 1))}
                      disabled={effectiveAccountPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAccountPage((p) => Math.min(totalAccountPages, p + 1))}
                      disabled={effectiveAccountPage >= totalAccountPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        )}
      </Card>
      )}
    </div>
  );
}
