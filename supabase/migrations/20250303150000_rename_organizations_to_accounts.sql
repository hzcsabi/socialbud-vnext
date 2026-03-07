-- Rename organizations → accounts and related tables/columns.
-- Drop RLS policies that reference old names, then rename, then recreate policies.

-- 1. Drop policies that reference organization_members / organizations (so we can rename tables)
DROP POLICY IF EXISTS "Users can select organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update their organizations" ON organizations;

DROP POLICY IF EXISTS "Users can select members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON organization_members;

DROP POLICY IF EXISTS "Org members can select invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON organization_invitations;

DROP POLICY IF EXISTS "Users can select billing config for their organizations" ON organization_billing;

DROP POLICY IF EXISTS "Users can select subscriptions for orgs they belong to" ON subscriptions;

-- 2. Rename tables and columns
ALTER TABLE organizations RENAME TO accounts;
ALTER TABLE accounts RENAME COLUMN parent_organization_id TO parent_account_id;

ALTER TABLE organization_members RENAME COLUMN organization_id TO account_id;
ALTER TABLE organization_members RENAME TO account_members;

ALTER TABLE organization_invitations RENAME COLUMN organization_id TO account_id;
ALTER TABLE organization_invitations RENAME TO account_invitations;

ALTER TABLE billing_accounts RENAME COLUMN owner_organization_id TO owner_account_id;

ALTER TABLE organization_billing RENAME COLUMN organization_id TO account_id;
ALTER TABLE organization_billing RENAME TO account_billing;

-- 3. Recreate RLS policies with new names
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

CREATE POLICY "Users can select members of their accounts"
  ON account_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON account_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Account members can select invitations"
  ON account_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_invitations.account_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage invitations"
  ON account_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_invitations.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_invitations.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can select billing config for their accounts"
  ON account_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_billing.account_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can select subscriptions for accounts they belong to"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM account_billing ab
      JOIN account_members am ON am.account_id = ab.account_id
      WHERE ab.billing_account_id = subscriptions.billing_account_id
        AND am.user_id = auth.uid()
    )
  );
