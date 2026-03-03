import { z } from "zod";

export const enqueueJobBodySchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({}),
});

export type EnqueueJobBody = z.infer<typeof enqueueJobBodySchema>;
