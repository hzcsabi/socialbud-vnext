-- Organization hierarchy: optional parent (top-level = NULL, suborg = parent id)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_parent_organization_id
  ON organizations (parent_organization_id);

-- Drop kind: behavior is derived from hierarchy + billing, not a type label
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_kind_check;

ALTER TABLE organizations
  DROP COLUMN IF EXISTS kind;

-- Billing: one card per org, always organization-owned (no user-owned billing accounts)
ALTER TABLE billing_accounts
  DROP CONSTRAINT IF EXISTS billing_accounts_owner_xor;

ALTER TABLE billing_accounts
  DROP CONSTRAINT IF EXISTS billing_accounts_owner_type_match;

DROP INDEX IF EXISTS idx_billing_accounts_owner_user_id;

-- Remove user-owned billing accounts (no longer supported)
DELETE FROM billing_accounts
WHERE owner_type = 'user' OR owner_organization_id IS NULL;

ALTER TABLE billing_accounts
  DROP COLUMN IF EXISTS owner_type;

ALTER TABLE billing_accounts
  DROP COLUMN IF EXISTS owner_user_id;

ALTER TABLE billing_accounts
  ALTER COLUMN owner_organization_id SET NOT NULL;
