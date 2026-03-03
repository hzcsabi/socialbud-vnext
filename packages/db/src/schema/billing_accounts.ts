export type BillingAccountOwnerType = "user" | "organization";

export type BillingModel = "self_serve" | "sponsored" | "invoice";

export interface BillingAccountRow {
  id: string;
  owner_type: BillingAccountOwnerType;
  owner_user_id: string | null;
  owner_organization_id: string | null;
  stripe_customer_id: string | null;
  billing_model: BillingModel;
  created_at: Date;
  updated_at: Date;
}

export const BILLING_ACCOUNTS_TABLE = "billing_accounts";

export const createBillingAccountsTableSql = `
CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'organization')),
  owner_user_id UUID,
  owner_organization_id UUID,
  stripe_customer_id TEXT,
  billing_model TEXT NOT NULL CHECK (billing_model IN ('self_serve', 'sponsored', 'invoice')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_accounts_owner_xor CHECK (
    (owner_user_id IS NULL) IS DISTINCT FROM (owner_organization_id IS NULL)
  ),
  CONSTRAINT billing_accounts_owner_type_match CHECK (
    (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_organization_id IS NULL)
    OR (owner_type = 'organization' AND owner_organization_id IS NOT NULL AND owner_user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_owner_user_id
  ON billing_accounts (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_owner_organization_id
  ON billing_accounts (owner_organization_id);
`;

// RLS: billing_accounts is intended for backend/service-role access only.
// Enable RLS but do not create any policies for anon/authenticated keys.
export const enableRlsBillingAccountsSql = `
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
`;

