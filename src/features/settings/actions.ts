"use server";

import { refreshStorefront } from "@/features/products/refresh";
import { z } from "zod";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction, SETTINGS_ROLES } from "@/features/auth/dal";
import { getPrisma } from "@/lib/prisma";
import { toWhatsAppDigits } from "@/lib/whatsapp";
import { SETTINGS_TAG } from "./queries";
import { settingsSchema } from "./schemas";
import { sizeGuideSchema } from "./size-guide";
import { siteConfig } from "@/config/site";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const d = parsed.data;
  const blank = (v?: string) => (v ? v : null);
  const data = {
    businessName: d.businessName,
    // Stored in international format so wa.me links always work.
    whatsappNumber: toWhatsAppDigits(d.whatsappNumber),
    contactEmail: blank(d.contactEmail),
    contactPhone: blank(d.contactPhone),
    address: blank(d.address),
    instagramUrl: blank(d.instagramUrl),
    facebookUrl: blank(d.facebookUrl),
    tiktokUrl: blank(d.tiktokUrl),
    deliveryInfo: blank(d.deliveryInfo),
    announcementText: blank(d.announcementText),
    announcementEnabled: d.announcementEnabled,
  };
  await getPrisma().businessSetting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  await logActivity({ userId: auth.user.id, action: "settings.update", entityType: "BusinessSetting", entityId: "1" });
  refreshStorefront(SETTINGS_TAG);
  return { ok: true };
}

export async function saveSizeGuide(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = sizeGuideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the size chart." };
  const sizeGuide = parsed.data;
  await getPrisma().businessSetting.upsert({
    where: { id: 1 },
    update: { sizeGuide },
    create: { id: 1, whatsappNumber: siteConfig.whatsappNumber, sizeGuide },
  });
  await logActivity({ userId: auth.user.id, action: "settings.size_guide", entityType: "BusinessSetting", entityId: "1" });
  refreshStorefront(SETTINGS_TAG);
  return { ok: true };
}
