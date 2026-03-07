export interface AccountRow {
  id: string;
  name: string;
  slug: string | null;
  parent_account_id: string | null;
  /** When set, account is soft-deleted (hidden from admin UI). Kept for analytics. */
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const ACCOUNTS_TABLE = "accounts";

export const createAccountsTableSql = `
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_slug_not_null ON accounts (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_parent_account_id ON accounts (parent_account_id);
`;

/** Run on existing DBs to add deleted_at for soft deletion. */
export const alterAccountsAddDeletedAtSql = `
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
`;

export const enableRlsAccountsSql = `
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select accounts they are members of"
  ON accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_members.account_id = accounts.id
        AND account_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update their accounts"
  ON accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_members.account_id = accounts.id
        AND account_members.user_id = auth.uid()
        AND account_members.role IN ('owner', 'admin')
    )
  );
`;
