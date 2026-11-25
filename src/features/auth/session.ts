import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

/**
 * Database-backed admin sessions. The cookie holds a random 256-bit token;
 * only its SHA-256 hash is stored, so a database leak can't be replayed.
 */
export const SESSION_COOKIE = "orack_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta: { ipAddress?: string | null; userAgent?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getPrisma().adminSession.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ipAddress: meta.ipAddress ?? null, userAgent: meta.userAgent?.slice(0, 300) ?? null },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Reads and validates the session once per request. Returns null when signed out, expired or deactivated. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getPrisma().adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.isActive) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role };
});

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getPrisma().adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}
