import "server-only";
import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by Postgres (no Redis needed at this scale).
 * One atomic INSERT … ON CONFLICT … RETURNING per check, so concurrent requests
 * can't slip past the limit.
 */
export interface RateLimitRule {
  /** Namespace, e.g. "order" */
  name: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  placeOrder: { name: "order", limit: 10, windowMs: 10 * 60 * 1000 },
  customRequest: { name: "custom", limit: 5, windowMs: 10 * 60 * 1000 },
  customFinalize: { name: "custom-finalize", limit: 30, windowMs: 10 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

export function rateLimitKey(rule: RateLimitRule, identifier: string): string {
  // Hash so raw IP addresses are never stored.
  return `${rule.name}:${createHash("sha256").update(identifier).digest("hex").slice(0, 32)}`;
}

export async function checkRateLimit(rule: RateLimitRule, identifier: string, now = Date.now()): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const windowStart = new Date(Math.floor(now / rule.windowMs) * rule.windowMs);
  const key = rateLimitKey(rule, identifier);
  const prisma = getPrisma();

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);

  // Occasional clean-up of expired windows.
  if (Math.random() < 0.02) {
    await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } } }).catch(() => undefined);
  }

  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: Math.ceil((windowStart.getTime() + rule.windowMs - now) / 1000),
  };
}
