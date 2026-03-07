export interface SubscriptionRow {
  id: string;
  billing_account_id: string;
  status: string;
  plan: string | null;
  stripe_subscription_id: string | null;
  current_period_end: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const SUBSCRIPTIONS_TABLE = "subscriptions";

export const createSubscriptionsTableSql = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  plan TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id
  ON subscriptions (billing_account_id);
`;

export const enableRlsSubscriptionsSql = `
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

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
`;
