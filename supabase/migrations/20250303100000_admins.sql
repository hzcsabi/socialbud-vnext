-- Platform admins (invite-only; add via manual SQL or service role)
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own row (if they have one, they are an admin)
CREATE POLICY "Users can select own admin row"
  ON admins FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE for anon key; use Supabase SQL Editor or service role to add admins.
