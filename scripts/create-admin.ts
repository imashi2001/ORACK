/**
 * Creates (or resets the password of) an admin user.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' ADMIN_NAME='Your Name' npm run admin:create
 *
 * Optional: ADMIN_ROLE=OWNER|ADMIN|STAFF (default OWNER).
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PASSWORD_HASH_OPTIONS, MIN_PASSWORD_LENGTH } from "../src/features/auth/password-policy";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const role = (process.env.ADMIN_ROLE ?? "OWNER") as "OWNER" | "ADMIN" | "STAFF";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (!["OWNER", "ADMIN", "STAFF"].includes(role)) throw new Error("ADMIN_ROLE must be OWNER, ADMIN or STAFF.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
  });
  try {
    const passwordHash = await hash(password, PASSWORD_HASH_OPTIONS);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, name, role, isActive: true, failedLoginCount: 0, lockedUntil: null },
      create: { email, name, role, passwordHash },
    });
    // Resetting a password signs the user out everywhere.
    await prisma.adminSession.deleteMany({ where: { userId: user.id } });
    console.log(`Admin ready: ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
