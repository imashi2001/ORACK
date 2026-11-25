import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio, seed) uses a direct, non-pooled connection.
// The app at runtime uses DATABASE_URL (Neon's pooled endpoint).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
