import { createDbClient, createJobsTableSql } from "@socialbud/db";
import { getEnv } from "./env.js";

const env = getEnv();
const pool = createDbClient(env.DATABASE_URL);

async function migrate() {
  await pool.query(createJobsTableSql);
  console.log("Jobs table ready.");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
