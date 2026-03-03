export type BillingMode = "individual_pays" | "organization_pays" | "sponsored";

export interface OrganizationBillingRow {
  id: string;
  organization_id: string;
  billing_account_id: string;
  billing_mode: BillingMode;
  created_at: Date;
  updated_at: Date;
}

export const ORGANIZATION_BILLING_TABLE = "organization_billing";

export const createOrganizationBillingTableSql = `
CREATE TABLE IF NOT EXISTS organization_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  billing_mode TEXT NOT NULL CHECK (billing_mode IN ('individual_pays', 'organization_pays', 'sponsored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_billing_billing_account_id
  ON organization_billing (billing_account_id);
`;

export const enableRlsOrganizationBillingSql = `
ALTER TABLE organization_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select billing config for their organizations"
  ON organization_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_billing.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );
`;

