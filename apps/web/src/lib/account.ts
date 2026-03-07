"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import { ensureUserAccount } from "@socialbud/services";
import { SELECTED_ACCOUNT_COOKIE } from "@/lib/account-constants";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Ensures the current user has at least one account and membership (creates
 * account + owner membership if missing). No-op if they already have a membership.
 * @throws if ensure fails (e.g. missing service role env or DB error)
 */
export async function ensureCurrentUserAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const adminSupabase = createServiceRoleClient();
  await ensureUserAccount(adminSupabase, user.id);
}

/**
 * Returns all accounts the current user is a member of (non-deleted).
 * Ensures at least one account exists before listing.
 */
export async function listUserAccounts(): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const adminSupabase = createServiceRoleClient();
    await ensureUserAccount(adminSupabase, user.id);

    const { data: members } = await adminSupabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", user.id);
    const accountIds = [...new Set((members ?? []).map((m) => m.account_id))];
    if (accountIds.length === 0) return [];

    const { data: accounts } = await adminSupabase
      .from("accounts")
      .select("id, name")
      .in("id", accountIds)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    return (accounts ?? []).map((a) => ({ id: a.id, name: a.name }));
  } catch {
    return [];
  }
}

/**
 * Returns the currently selected account for the user.
 * Uses cookie when set and valid; if user has one account returns it; if multiple and no cookie returns null (must select).
 */
export async function getCurrentUserAccount(): Promise<{
  id: string;
  name: string;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const adminSupabase = createServiceRoleClient();
    await ensureUserAccount(adminSupabase, user.id);

    const accounts = await listUserAccounts();
    if (accounts.length === 0) return null;
    if (accounts.length === 1) return accounts[0]!;

    const cookieStore = await cookies();
    const selectedId = cookieStore.get(SELECTED_ACCOUNT_COOKIE)?.value;
    if (selectedId && accounts.some((a) => a.id === selectedId)) {
      const found = accounts.find((a) => a.id === selectedId);
      return found ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sets the selected account in a cookie. Optionally redirects to /app (e.g. after account selection page).
 */
export async function setSelectedAccount(
  accountId: string,
  redirectToApp?: boolean
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const accounts = await listUserAccounts();
  if (!accounts.some((a) => a.id === accountId)) return;

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_ACCOUNT_COOKIE, accountId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false, // so client can read if needed; server is source of truth
    secure: process.env.NODE_ENV === "production",
  });

  if (redirectToApp) redirect("/app");
}
