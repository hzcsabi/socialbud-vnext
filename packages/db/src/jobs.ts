import type { Pool } from "pg";
import { JOBS_TABLE, type JobRow, type JobStatus } from "./schema/jobs.js";

export interface EnqueueInput {
  type: string;
  payload: Record<string, unknown>;
}

export async function enqueueJob(pool: Pool, input: EnqueueInput): Promise<JobRow> {
  const result = await pool.query<JobRow>(
    `INSERT INTO ${JOBS_TABLE} (type, payload, status, run_at, attempts)
     VALUES ($1, $2, 'pending', NOW(), 0)
     RETURNING id, type, payload, status, run_at, attempts, created_at, updated_at`,
    [input.type, JSON.stringify(input.payload ?? {})]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Insert job failed");
  return {
    ...row,
    payload: (row.payload as Record<string, unknown>) ?? {},
    run_at: new Date(row.run_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function claimNextJob(pool: Pool): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE ${JOBS_TABLE}
     SET status = 'running', updated_at = NOW()
     WHERE id = (
       SELECT id FROM ${JOBS_TABLE}
       WHERE status = 'pending' AND run_at <= NOW()
       ORDER BY run_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, type, payload, status, run_at, attempts, created_at, updated_at`
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    payload: (row.payload as Record<string, unknown>) ?? {},
    run_at: new Date(row.run_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function completeJob(pool: Pool, id: string): Promise<void> {
  await pool.query(
    `UPDATE ${JOBS_TABLE} SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function failJob(pool: Pool, id: string): Promise<void> {
  await pool.query(
    `UPDATE ${JOBS_TABLE} SET status = 'failed', attempts = attempts + 1, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}
