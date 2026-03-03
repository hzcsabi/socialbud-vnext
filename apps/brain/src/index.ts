import Fastify from "fastify";
import { createDbClient, enqueueJob } from "@socialbud/db";
import { enqueueJobBodySchema } from "@socialbud/shared";
import { getEnv } from "./env.js";

const env = getEnv();
const pool = createDbClient(env.DATABASE_URL);

const fastify = Fastify({ logger: true });

fastify.get("/health", async () => {
  return { ok: true };
});

fastify.post("/jobs/enqueue", async (request, reply) => {
  const parsed = enqueueJobBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Invalid body", issues: parsed.error.issues });
  }
  const { type, payload } = parsed.data;
  const job = await enqueueJob(pool, { type, payload });
  return reply.status(202).send({
    id: job.id,
    type: job.type,
    status: job.status,
    run_at: job.run_at.toISOString(),
  });
});

const port = Number(process.env["PORT"] ?? 3001);

async function start() {
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
