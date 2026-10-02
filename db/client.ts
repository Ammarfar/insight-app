import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDatabase = globalThis as unknown as { insightFlowPool?: Pool };
const pool = globalForDatabase.insightFlowPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 10 : 5,
});
if (process.env.NODE_ENV !== "production") globalForDatabase.insightFlowPool = pool;

export const db = drizzle({ client: pool, schema });
export type Database = typeof db;
