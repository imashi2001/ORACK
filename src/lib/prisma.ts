import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon pooled connection string.");
  }
  // node-postgres works with Neon's pooled endpoint and with a local Postgres,
  // and supports the interactive transactions used for order placement.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 5 }) });
}

/** One client per server process (and per hot-reload in dev). Created lazily so imports never need a DB. */
export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}
