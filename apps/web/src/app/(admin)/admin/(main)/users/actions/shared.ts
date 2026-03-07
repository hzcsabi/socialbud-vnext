export type UserAccountEntry = {
  accountId: string;
  accountName: string;
  role: string;
  memberCount: number;
  parentAccountName: string | null;
  hasSubaccounts: boolean;
};

export type UserStatus = "active" | "pending" | "banned" | "suspended" | "deleted";

export type UserListEntry = {
  id: string;
  email: string | null;
  name: string | null;
  website: string | null;
  status: UserStatus;
  createdAt: string;
  accounts: UserAccountEntry[];
};

import type { MemberRole } from "@/lib/roles";
export type { MemberRole };

export type AccountMemberEntry = {
  userId: string;
  email: string;
  name: string | null;
  status: UserStatus;
  role: MemberRole;
};

export type AccountListEntry = {
  id: string;
  name: string;
  parent_account_id: string | null;
  parentAccountName: string | null;
  memberCount: number;
  hasSubaccounts: boolean;
  /** Number of direct sub-accounts (parent_account_id = this account). */
  subaccountCount: number;
  memberEmails: string[];
  members: AccountMemberEntry[];
  /** Subscription status (e.g. active, canceled). Null if no subscription. */
  subscriptionStatus: string | null;
  /** Plan name (active or last used if canceled). Null if none. */
  plan: string | null;
  /** Who is responsible for payment: account name or "Self" when the account pays for itself. */
  billingResponsible: string | null;
};
