export type MemberRole = "owner" | "admin" | "member";

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: Date;
}

export const ORGANIZATION_MEMBERS_TABLE = "organization_members";

export const createOrganizationMembersTableSql = `
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_organization_members_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members (user_id);
`;

export const enableRlsOrganizationMembersSql = `
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select members of their organizations"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );
`;
