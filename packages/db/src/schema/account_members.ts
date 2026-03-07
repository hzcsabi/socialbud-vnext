export type MemberRole = "owner" | "manager" | "member";

export interface AccountMemberRow {
  id: string;
  account_id: string;
  user_id: string;
  role: MemberRole;
  created_at: Date;
}

export const ACCOUNT_MEMBERS_TABLE = "account_members";

export const createAccountMembersTableSql = `
CREATE TABLE IF NOT EXISTS account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_account_members_account_user UNIQUE (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON account_members (user_id);
`;

export const enableRlsAccountMembersSql = `
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select members of their accounts"
  ON account_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can manage members"
  ON account_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'manager')
    )
  );
`;
