import { createDbClient, claimNextJob, completeJob, failJob } from "@socialbud/db";
import { executeJob } from "@socialbud/domain";
import { getEnv } from "./env.js";

const env = getEnv();
const pool = createDbClient(env.DATABASE_URL);

const POLL_MS = 2000;

async function runLoop() {
  // eslint-disable-next-line no-console
  console.log("[worker] polling for jobs...");
  const job = await claimNextJob(pool);
  if (!job) {
    setTimeout(runLoop, POLL_MS);
    return;
  }
  try {
    executeJob({
      jobId: job.id,
      type: job.type,
      payload: job.payload,
    });
    await completeJob(pool, job.id);
  } catch (err) {
    console.error("[worker] job failed", job.id, err);
    await failJob(pool, job.id);
  }
  setTimeout(runLoop, 0);
}

runLoop();
