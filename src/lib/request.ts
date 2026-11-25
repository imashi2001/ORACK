import "server-only";
import { headers } from "next/headers";

/** Client IP and user agent for audit logs and throttling. On Vercel, x-forwarded-for is set by the platform. */
export async function getRequestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { ipAddress: forwarded || h.get("x-real-ip") || null, userAgent: h.get("user-agent") };
}
