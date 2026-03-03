import { z } from "zod";

const brainEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3001),
});

export type BrainEnv = z.infer<typeof brainEnvSchema>;

export function getEnv(): BrainEnv {
  return brainEnvSchema.parse(process.env);
}
