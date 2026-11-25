import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { getSessionUser, type SessionUser } from "./session";

/**
 * Data Access Layer guard. Every admin page and Server Action calls this
 * close to the data; the proxy redirect is only a convenience.
 *
 * Roles: OWNER and ADMIN manage everything; STAFF handles orders only.
 */
export const CATALOG_ROLES: Role[] = ["OWNER", "ADMIN"];
export const SETTINGS_ROLES: Role[] = ["OWNER", "ADMIN"];

export async function requireAdmin(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}

/** For Server Actions: returns an error result instead of redirecting when the role is missing. */
export async function authorizeAction(roles?: Role[]): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (roles && !roles.includes(user.role)) return { ok: false, error: "You don't have permission to do that." };
  return { ok: true, user };
}
