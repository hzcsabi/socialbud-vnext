"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchUsersForAdmin,
  addAdminByUserId,
  type UserLookupEntry,
} from "./actions";

const DEBOUNCE_MS = 300;

export function AddAdminForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserLookupEntry[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setSearchError(null);
      setHasSearched(false);
      setSearching(false);
      return;
    }
    setSearchError(null);
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      const { users: list, error } = await searchUsersForAdmin(trimmed);
      if (cancelled) return;
      setSearching(false);
      if (error) setSearchError(error);
      else setUsers(list);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const handleAdd = useCallback(async (user: UserLookupEntry) => {
    setAddError(null);
    setAddingId(user.id);
    const { error } = await addAdminByUserId(user.id);
    setAddingId(null);
    if (error) setAddError(error);
    else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setQuery("");
      router.refresh();
    }
  }, [router]);

  return (
    <div className="mt-4 space-y-4">
      <label className="flex flex-1 min-w-[200px] flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          Look up user
        </span>
        <Input
          type="text"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      {searching && (
        <p className="text-sm text-muted-foreground">Searching…</p>
      )}
      {searchError && (
        <p className="text-sm text-destructive" role="alert">
          {searchError}
        </p>
      )}
      {addError && (
        <p className="text-sm text-destructive" role="alert">
          {addError}
        </p>
      )}
      {users.length > 0 && (
        <ul className="rounded-md border border-border divide-y divide-border">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="truncate">
                {u.name ? `${u.name} · ${u.email ?? u.id}` : u.email ?? u.id}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={addingId !== null}
                onClick={() => handleAdd(u)}
              >
                {addingId === u.id ? "Adding…" : "Add as admin"}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {hasSearched && !searching && users.length === 0 && !searchError && (
        <p className="text-sm text-muted-foreground">
          No users found, or they are already admins.
        </p>
      )}
    </div>
  );
}
