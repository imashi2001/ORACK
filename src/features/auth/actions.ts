"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/features/admin/activity";
import { getPrisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/request";
import { verifyPassword } from "./password";
import { createSession, destroySession, getSessionUser } from "./session";
import { isLoginThrottled, LOCK_AFTER_FAILURES, LOCK_DURATION_MS, recordLoginAttempt } from "./throttle";

const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase().max(200),
  password: z.string().min(1, "Enter your password").max(200),
  redirectTo: z.string().max(300).optional(),
});

export interface LoginState {
  error?: string;
  email?: string;
}

const GENERIC_ERROR = "Incorrect email or password.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), redirectTo: formData.get("redirectTo") ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR, email: String(formData.get("email") ?? "") };
  const { email, password, redirectTo: next } = parsed.data;
  const { ipAddress, userAgent } = await getRequestMeta();

  if (await isLoginThrottled(email, ipAddress)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  const locked = !!user?.lockedUntil && user.lockedUntil.getTime() > Date.now();
  const valid = await verifyPassword(user?.passwordHash ?? null, password);

  if (!user || !valid || !user.isActive || locked) {
    await recordLoginAttempt(email, ipAddress, false);
    if (user && !valid) {
      const failures = user.failedLoginCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failures, lockedUntil: failures >= LOCK_AFTER_FAILURES ? new Date(Date.now() + LOCK_DURATION_MS) : undefined },
      });
    }
    return { error: locked ? "This account is temporarily locked. Try again later." : GENERIC_ERROR, email };
  }

  await recordLoginAttempt(email, ipAddress, true);
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(user.id, { ipAddress, userAgent });
  await logActivity({ userId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ipAddress });

  // Only allow redirects back into the admin area.
  redirect(next && /^\/admin(\/|$)/.test(next) && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const user = await getSessionUser();
  await destroySession();
  if (user) await logActivity({ userId: user.id, action: "auth.logout", entityType: "User", entityId: user.id });
  redirect("/admin/login");
}
