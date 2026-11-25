import "server-only";
import { getPrisma } from "@/lib/prisma";

/**
 * Brute-force protection using the LoginAttempt table (no Redis needed):
 *  - 5 failed attempts for one email in 15 minutes → that email is paused
 *  - 20 failed attempts from one IP in 15 minutes → that IP is paused
 *  - 10 consecutive failures lock the account for 30 minutes
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
export const LOCK_AFTER_FAILURES = 10;
export const LOCK_DURATION_MS = 30 * 60 * 1000;

export async function isLoginThrottled(email: string, ipAddress: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const prisma = getPrisma();
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } }),
    ipAddress ? prisma.loginAttempt.count({ where: { ipAddress, success: false, createdAt: { gte: since } } }) : Promise.resolve(0),
  ]);
  return byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

export async function recordLoginAttempt(email: string, ipAddress: string | null, success: boolean) {
  const prisma = getPrisma();
  await prisma.loginAttempt.create({ data: { email, ipAddress, success } });
  // Housekeeping: drop attempts older than a day.
  if (Math.random() < 0.05) {
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  }
}
