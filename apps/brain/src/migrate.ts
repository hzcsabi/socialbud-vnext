import {
  createDbClient,
  createJobsTableSql,
  createBillingAccountsTableSql,
  createOrganizationBillingTableSql,
  createOrganizationsTableSql,
  createOrganizationMembersTableSql,
  createProfilesTableSql,
  createSubscriptionsTableSql,
  enableRlsBillingAccountsSql,
  enableRlsOrganizationBillingSql,
  enableRlsOrganizationsSql,
  enableRlsOrganizationMembersSql,
  enableRlsProfilesSql,
  enableRlsSubscriptionsSql,
} from "@socialbud/db";
import { getEnv } from "./env.js";

const env = getEnv();
const pool = createDbClient(env.DATABASE_URL);

const migrations: { name: string; sql: string }[] = [
  { name: "billing_accounts", sql: createBillingAccountsTableSql },
  { name: "organizations", sql: createOrganizationsTableSql },
  { name: "organization_members", sql: createOrganizationMembersTableSql },
  { name: "profiles", sql: createProfilesTableSql },
  { name: "organization_billing", sql: createOrganizationBillingTableSql },
  { name: "subscriptions", sql: createSubscriptionsTableSql },
  { name: "billing_accounts RLS", sql: enableRlsBillingAccountsSql },
  { name: "organizations RLS", sql: enableRlsOrganizationsSql },
  { name: "organization_members RLS", sql: enableRlsOrganizationMembersSql },
  { name: "organization_billing RLS", sql: enableRlsOrganizationBillingSql },
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
