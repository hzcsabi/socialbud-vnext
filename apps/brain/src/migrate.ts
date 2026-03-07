import { config } from "dotenv";
import { resolve } from "path";
// When run via "pnpm db:migrate", cwd is apps/brain; load .env from likely locations
config(); // apps/brain/.env
config({ path: resolve(process.cwd(), "../../.env"), override: false }); // repo root
config({ path: resolve(process.cwd(), "../web/.env"), override: false }); // apps/web/.env
import {
  createDbClient,
  createJobsTableSql,
  createBillingAccountsTableSql,
  createAccountBillingTableSql,
  createAccountsTableSql,
  createAccountMembersTableSql,
  createProfilesTableSql,
  alterProfilesAddSuspendedAtSql,
  createSubscriptionsTableSql,
  enableRlsBillingAccountsSql,
  enableRlsAccountBillingSql,
  enableRlsAccountsSql,
  enableRlsAccountMembersSql,
  enableRlsProfilesSql,
  enableRlsSubscriptionsSql,
} from "@socialbud/db";
import { getEnv } from "./env.js";

const env = getEnv();
const pool = createDbClient(env.DATABASE_URL);

const migrations: { name: string; sql: string }[] = [
  { name: "billing_accounts", sql: createBillingAccountsTableSql },
  { name: "accounts", sql: createAccountsTableSql },
  { name: "account_members", sql: createAccountMembersTableSql },
  { name: "profiles", sql: createProfilesTableSql },
  { name: "profiles suspended_at", sql: alterProfilesAddSuspendedAtSql },
  { name: "account_billing", sql: createAccountBillingTableSql },
  { name: "subscriptions", sql: createSubscriptionsTableSql },
  { name: "billing_accounts RLS", sql: enableRlsBillingAccountsSql },
  { name: "accounts RLS", sql: enableRlsAccountsSql },
  { name: "account_members RLS", sql: enableRlsAccountMembersSql },
  { name: "account_billing RLS", sql: enableRlsAccountBillingSql },
  { name: "profiles RLS", sql: enableRlsProfilesSql },
  { name: "subscriptions RLS", sql: enableRlsSubscriptionsSql },
  { name: "jobs", sql: createJobsTableSql },
];

async function migrate() {
  for (const { name, sql } of migrations) {
    await pool.query(sql);
    console.log(`${name} ready.`);
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
