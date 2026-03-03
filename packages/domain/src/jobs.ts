/**
 * Minimal job execution for the vertical slice.
 * Worker calls this with (type, payload); no IO here, just logic.
 */
export interface JobContext {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
}

export function executeJob(ctx: JobContext): void {
  // Dummy handler: log execution. Real handlers will be added per job type later.
  // eslint-disable-next-line no-console
  console.log("[domain] job executed", {
    jobId: ctx.jobId,
    type: ctx.type,
    payload: ctx.payload,
  });
}
