import pg from "pg";

const { Pool } = pg;

export function createDbClient(connectionString: string): pg.Pool {
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });
}
