"use server";

import { z } from "zod";
import { siteConfig } from "@/config/site";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction, SETTINGS_ROLES } from "@/features/auth/dal";
import { refreshStorefront } from "@/features/products/refresh";
import { SETTINGS_TAG } from "@/features/settings/queries";
import { getPrisma } from "@/lib/prisma";
import { seasonalSchema } from "./config";

export async function saveSeasonal(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = seasonalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const seasonal = parsed.data;
  await getPrisma().businessSetting.upsert({
    where: { id: 1 },
    update: { seasonal },
    create: { id: 1, whatsappNumber: siteConfig.whatsappNumber, seasonal },
  });
  await logActivity({ userId: auth.user.id, action: seasonal.enabled ? "seasonal.on" : "seasonal.off", entityType: "BusinessSetting", entityId: "1", metadata: { preset: seasonal.preset } });
  refreshStorefront(SETTINGS_TAG);
  return { ok: true };
}
