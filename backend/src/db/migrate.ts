import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";

// Resolve migrations folder relative to this file, not process.cwd().
// The folder lives next to this script at backend/src/db/migrations.
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "migrations");

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  console.log(`Running migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
