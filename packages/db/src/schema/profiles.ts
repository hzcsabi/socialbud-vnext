export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  website: string | null;
  /** When set and in the future, user is suspended (admin UI). Not in Auth. */
  suspended_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const PROFILES_TABLE = "profiles";

export const createProfilesTableSql = `
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

`;

/** Run after createProfilesTableSql on existing DBs to add suspended_at. */
export const alterProfilesAddSuspendedAtSql = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;
`;

export const enableRlsProfilesSql =
  "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;\n" +
  'CREATE POLICY "Users can select any profile" ON profiles FOR SELECT USING (true);\n' +
  'CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());\n' +
  'CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());\n';
