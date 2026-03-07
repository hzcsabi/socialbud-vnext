export type BillingMode = "individual_pays" | "organization_pays" | "sponsored";

export interface AccountBillingRow {
  id: string;
  account_id: string;
  billing_account_id: string;
  billing_mode: BillingMode;
  created_at: Date;
  updated_at: Date;
}

export const ACCOUNT_BILLING_TABLE = "account_billing";

export const createAccountBillingTableSql = `
CREATE TABLE IF NOT EXISTS account_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  billing_mode TEXT NOT NULL CHECK (billing_mode IN ('individual_pays', 'organization_pays', 'sponsored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_billing_billing_account_id
  ON account_billing (billing_account_id);
`;

export const enableRlsAccountBillingSql = `
ALTER TABLE account_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select billing config for their accounts"
  ON account_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_billing.account_id
        AND am.user_id = auth.uid()
    )
  );
`;
