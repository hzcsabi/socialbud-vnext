export type BillingModel = "self_serve" | "sponsored" | "invoice";

export interface BillingAccountRow {
  id: string;
  owner_organization_id: string;
  stripe_customer_id: string | null;
  billing_model: BillingModel;
  created_at: Date;
  updated_at: Date;
}

export const BILLING_ACCOUNTS_TABLE = "billing_accounts";

export const createBillingAccountsTableSql = `
CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  billing_model TEXT NOT NULL CHECK (billing_model IN ('self_serve', 'sponsored', 'invoice')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_owner_organization_id
  ON billing_accounts (owner_organization_id);
`;

// RLS: billing_accounts is intended for backend/service-role access only.
// Enable RLS but do not create any policies for anon/authenticated keys.
export const enableRlsBillingAccountsSql = `
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
`;

