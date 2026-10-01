import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  // In development, we might not have it set yet, but it's required for runtime.
  // We'll throw an error if it's accessed or let it fail naturally.
  // console.warn('DATABASE_URL is not defined');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
