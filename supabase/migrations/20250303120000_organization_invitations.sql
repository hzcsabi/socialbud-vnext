-- Organization invitations (invite by email to join a workspace)
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations (token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_status ON organization_invitations (organization_id, status);

-- One pending invite per (org, email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invitations_org_email_pending
  ON organization_invitations (organization_id, LOWER(email))
  WHERE status = 'pending';

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Org members can select invitations for their org
CREATE POLICY "Org members can select invitations"
  ON organization_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- Owners and admins can insert (create invite) and update (revoke, mark accepted)
CREATE POLICY "Owners and admins can manage invitations"
  ON organization_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );
