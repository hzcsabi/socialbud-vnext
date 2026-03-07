-- Rename account member role: admin → manager (avoids confusion with platform /admin app).

-- 1. Data: existing admin role becomes manager
UPDATE account_members SET role = 'manager' WHERE role = 'admin';

-- 2. Constraint: allow only owner, manager, member (constraint name may be from initial org_members or account_members)
ALTER TABLE account_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE account_members DROP CONSTRAINT IF EXISTS account_members_role_check;
ALTER TABLE account_members ADD CONSTRAINT account_members_role_check CHECK (role IN ('owner', 'manager', 'member'));

-- 3. RLS: update policies that referenced 'admin' to 'manager'
DROP POLICY IF EXISTS "Owners and admins can update their accounts" ON accounts;
CREATE POLICY "Owners and managers can update their accounts"
  ON accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_members.account_id = accounts.id
        AND account_members.user_id = auth.uid()
        AND account_members.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can manage members" ON account_members;
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

DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON account_invitations;
CREATE POLICY "Owners and managers can manage invitations"
  ON account_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_invitations.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_invitations.account_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'manager')
    )
  );
