"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteUserButton } from "./delete-user-button";
import type { UserListEntry, OrganizationListEntry } from "./actions";

const PAGE_SIZE = 50;

function statusLabel(status: "active" | "pending" | "banned") {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "banned":
      return "Banned";
    default:
      return status;
  }
}

function statusClass(status: "active" | "pending" | "banned") {
  switch (status) {
    case "active":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "banned":
      return "bg-destructive/15 text-destructive";
    default:
      return "";
  }
}

function matchesSearch(text: string | null, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

type MainTab = "users" | "orgs";
type OrgTab = "individual" | "parent";

type Props = {
  users: UserListEntry[];
  organizations: OrganizationListEntry[];
  currentUserId: string | null;
  error?: string;
  orgsError?: string;
};

export function AdminUsersContent({
  users,
  organizations,
  currentUserId,
  error,
  orgsError,
}: Props) {
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("users");
  const [orgTab, setOrgTab] = useState<OrgTab>("individual");
  const [userPage, setUserPage] = useState(1);
  const [orgPage, setOrgPage] = useState(1);

  useEffect(() => {
    setOrgPage(1);
  }, [orgTab]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      if (matchesSearch(u.name, q) || matchesSearch(u.email, q) || matchesSearch(u.website, q))
        return true;
      if (u.organizations.some((o) => matchesSearch(o.orgName, q) || matchesSearch(o.parentOrgName, q)))
        return true;
      return false;
    });
  }, [users, search]);

  const individualOrgs = useMemo(
    () => organizations.filter((o) => !o.hasSuborgs),
    [organizations]
  );
  const parentOrgs = useMemo(
    () => organizations.filter((o) => o.hasSuborgs),
    [organizations]
  );

  const filterOrgs = (list: OrganizationListEntry[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) =>
        matchesSearch(o.name, q) ||
        matchesSearch(o.parentOrgName, q) ||
        o.memberEmails.some((e) => matchesSearch(e, q))
    );
  };

  const filteredIndividualOrgs = useMemo(
    () => filterOrgs(individualOrgs),
    [individualOrgs, search]
  );
  const filteredParentOrgs = useMemo(
    () => filterOrgs(parentOrgs),
    [parentOrgs, search]
  );

  const currentOrgs =
    orgTab === "individual" ? filteredIndividualOrgs : filteredParentOrgs;

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const effectiveUserPage = Math.min(Math.max(1, userPage), totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (effectiveUserPage - 1) * PAGE_SIZE,
    effectiveUserPage * PAGE_SIZE
  );

  const totalOrgPages = Math.max(1, Math.ceil(currentOrgs.length / PAGE_SIZE));
  const effectiveOrgPage = Math.min(Math.max(1, orgPage), totalOrgPages);
  const paginatedOrgs = currentOrgs.slice(
    (effectiveOrgPage - 1) * PAGE_SIZE,
    effectiveOrgPage * PAGE_SIZE
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
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "orgs"}
          onClick={() => setMainTab("orgs")}
          className={cn(
            "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mainTab === "orgs"
              ? "border-border bg-background text-foreground -mb-px"
              : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Orgs ({filteredIndividualOrgs.length + filteredParentOrgs.length})
        </button>
      </div>

      <div className="mt-4 w-full">
        <Input
          type="search"
          placeholder="Filter users and orgs by name, email, website…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
          aria-label="Filter users and orgs"
        />
      </div>

      {mainTab === "users" && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            Name, email, organizations (with role and member count), website, and status (Active = confirmed email; Pending = not yet confirmed; Banned = access revoked).
          </CardDescription>
          {error ? (
            <p className="text-sm text-destructive">
              {error}. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your env.
            </p>
          ) : null}
        </CardHeader>
        {!error && (
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {users.length === 0 ? "No users yet." : "No users match the search."}
              </p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Organizations</th>
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
                          {u.organizations.length === 0 ? (
                            "—"
                          ) : (
                            <ul className="space-y-1.5">
                              {u.organizations.map((org) => (
                                <li key={org.orgId} className="text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMainTab("orgs");
                                      setOrgTab(org.hasSuborgs ? "parent" : "individual");
                                      setSearch(org.orgName);
                                      setOrgPage(1);
                                    }}
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                  >
                                    {org.orgName}
                                  </button>
                                  <span className="ml-1 rounded bg-muted px-1.5 py-0.5 capitalize">
                                    {org.role}
                                  </span>
                                  <span className="ml-1 text-muted-foreground">
                                    ({org.memberCount} member{org.memberCount !== 1 ? "s" : ""})
                                  </span>
                                  {org.parentOrgName ? (
                                    <span className="ml-1 text-muted-foreground">
                                      ↑ Parent: {org.parentOrgName}
                                    </span>
                                  ) : null}
                                  {org.hasSuborgs ? (
                                    <span className="ml-1 text-muted-foreground">
                                      ↓ suborgs
                                    </span>
                                  ) : null}
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
                          <DeleteUserButton
                            userId={u.id}
                            email={u.email}
                            disabled={u.id === currentUserId}
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

      {mainTab === "orgs" && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            All organizations with parent, member count, suborgs, and member emails. Sorted by member count (desc). Useful for debugging and cleanup.
          </CardDescription>
          {orgsError ? (
            <p className="text-sm text-destructive">{orgsError}</p>
          ) : null}
        </CardHeader>
        {!orgsError && (
          <CardContent>
            <div
              className="mb-4 flex gap-0 border-b border-border"
              role="tablist"
              aria-label="Organization type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={orgTab === "individual"}
                onClick={() => setOrgTab("individual")}
                className={cn(
                  "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  orgTab === "individual"
                    ? "border-border bg-background text-foreground -mb-px"
                    : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Individual ({filteredIndividualOrgs.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={orgTab === "parent"}
                onClick={() => setOrgTab("parent")}
                className={cn(
                  "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  orgTab === "parent"
                    ? "border-border bg-background text-foreground -mb-px"
                    : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Parent orgs ({filteredParentOrgs.length})
              </button>
            </div>
            {currentOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {orgTab === "individual"
                  ? individualOrgs.length === 0
                    ? "No individual organizations yet."
                    : "No individual organizations match the search."
                  : parentOrgs.length === 0
                    ? "No parent organizations yet."
                    : "No parent organizations match the search."}
              </p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Parent</th>
                      <th className="px-4 py-3 text-left font-medium">Members</th>
                      <th className="px-4 py-3 text-left font-medium">Has suborgs</th>
                      <th className="px-4 py-3 text-left font-medium">Member emails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrgs.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{o.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {o.parentOrgName ?? "—"}
                        </td>
                        <td className="px-4 py-3">{o.memberCount}</td>
                        <td className="px-4 py-3">
                          {o.hasSuborgs ? "Yes" : "—"}
                        </td>
                        <td
                          className="max-w-xs truncate px-4 py-3 text-muted-foreground"
                          title={o.memberEmails.join(", ")}
                        >
                          {o.memberEmails.length === 0
                            ? "—"
                            : o.memberEmails.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalOrgPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Page {effectiveOrgPage} of {totalOrgPages} ({currentOrgs.length} orgs)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                      disabled={effectiveOrgPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrgPage((p) => Math.min(totalOrgPages, p + 1))}
                      disabled={effectiveOrgPage >= totalOrgPages}
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
