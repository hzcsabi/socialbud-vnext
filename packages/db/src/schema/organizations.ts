export type OrganizationKind = "individual" | "team" | "corporation";

export interface OrganizationRow {
  id: string;
  kind: OrganizationKind;
  name: string;
  slug: string | null;
  created_at: Date;
  updated_at: Date;
}

export const ORGANIZATIONS_TABLE = "organizations";

export const createOrganizationsTableSql = `
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('individual', 'team', 'corporation')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_not_null ON organizations (slug) WHERE slug IS NOT NULL;
`;

export const enableRlsOrganizationsSql = `
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select organizations they are members of"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );
`;
