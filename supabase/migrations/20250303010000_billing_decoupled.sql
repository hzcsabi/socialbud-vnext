-- Billing accounts: who is billed
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

-- Organization billing: how each workspace is paid for
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

-- Subscriptions now belong to billing_accounts, not organizations
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_account_id UUID;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_billing_account_fk
  FOREIGN KEY (billing_account_id)
  REFERENCES billing_accounts(id)
  ON DELETE CASCADE;

-- Drop policy that references organization_id before dropping the column
DROP POLICY IF EXISTS "Users can select subscriptions for orgs they belong to" ON subscriptions;

DROP INDEX IF EXISTS idx_subscriptions_organization_id;

ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS organization_id;

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id
  ON subscriptions (billing_account_id);

-- RLS: billing_accounts (backend-only, no client policies)
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- RLS: organization_billing
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

-- Update RLS: subscriptions now resolve access via organization_billing
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select subscriptions for orgs they belong to"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_billing ob
      JOIN organization_members om
        ON om.organization_id = ob.organization_id
      WHERE ob.billing_account_id = subscriptions.billing_account_id
        AND om.user_id = auth.uid()
    )
  );

