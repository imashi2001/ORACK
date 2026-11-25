// Prepares a clean database and a production build for the Playwright tests.
//   E2E_DATABASE_URL=postgresql://…/orack_e2e_test npm run test:e2e
// The database name must contain "test"; every table in it is emptied.
import { execSync } from "node:child_process";
import pg from "pg";

const url = process.env.E2E_DATABASE_URL;
if (!url) {
  console.error("Set E2E_DATABASE_URL to a disposable database (its name must contain 'test').");
  process.exit(1);
}
const dbName = new URL(url).pathname.slice(1);
if (!dbName.includes("test")) {
  console.error(`Refusing to run: database name "${dbName}" must contain "test".`);
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: url,
  DIRECT_URL: url,
  ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL ?? "admin@e2e.test",
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD ?? "e2e-password-123",
  ADMIN_NAME: "E2E Admin",
  ADMIN_ROLE: "OWNER",
};
const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

// E2E_REUSE=1 re-runs the tests against the previous build AND data. The storefront is
// prerendered from the database, so resetting the data without rebuilding would leave
// pages pointing at deleted products.
if (process.env.E2E_REUSE) {
  console.log("[e2e] Reusing the previous database and build.");
  process.exit(0);
}

run("npx prisma migrate deploy");

const client = new pg.Client({ connectionString: url });
await client.connect();
const { rows } = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`);
if (rows.length) await client.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
await client.end();

run("npx tsx prisma/seed.ts");
run("npx tsx scripts/create-admin.ts");
run("npx next build");
