import { execSync } from "node:child_process";

/**
 * Applies migrations to the test database once per run.
 * Guard: the database name must contain "test" so a real database is never wiped.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn("\n[integration] TEST_DATABASE_URL is not set — integration tests will be skipped.\n");
    return;
  }
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.includes("test")) throw new Error(`Refusing to run: test database name "${dbName}" must contain "test".`);
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url } });
}
