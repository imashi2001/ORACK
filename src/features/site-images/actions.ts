"use server";

import { z } from "zod";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction, SETTINGS_ROLES } from "@/features/auth/dal";
import { refreshStorefront } from "@/features/products/refresh";
import { getPrisma } from "@/lib/prisma";
import { deleteObject, headObject, isR2Configured, makeObjectKey, presignUpload, publicUrlFor } from "@/lib/r2";
import { SITE_IMAGES_TAG } from "./queries";
import { isFixedSlot, isValidSlotShape, MAX_SITE_IMAGE_BYTES, SITE_IMAGE_TYPES } from "./slots";

const slotSchema = z.string().max(60).refine(isValidSlotShape, "Unknown image slot");

/** Fixed slots always exist; category slots must point at a real category. */
async function slotExists(slot: string) {
  if (isFixedSlot(slot)) return true;
  const id = slot.slice("category.".length);
  return (await getPrisma().category.count({ where: { id } })) > 0;
}

const keyPrefix = (slot: string) => `site/${slot.replace(/\./g, "-")}`;

export async function requestSiteImageUpload(input: unknown): Promise<ActionResult<{ uploadUrl: string; objectKey: string }>> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  if (!isR2Configured("public")) return { ok: false, error: "Image storage isn't configured yet. Add the R2_* variables to your environment." };
  const parsed = z
    .object({ slot: slotSchema, contentType: z.enum(SITE_IMAGE_TYPES), size: z.number().int().positive().max(MAX_SITE_IMAGE_BYTES, "Images must be 12 MB or smaller") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  if (!(await slotExists(parsed.data.slot))) return { ok: false, error: "That section no longer exists." };
  const objectKey = makeObjectKey(keyPrefix(parsed.data.slot), parsed.data.contentType);
  const uploadUrl = await presignUpload("public", objectKey, parsed.data.contentType, parsed.data.size);
  return { ok: true, data: { uploadUrl, objectKey } };
}

export async function attachSiteImage(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = z.object({ slot: slotSchema, objectKey: z.string().min(1).max(300), altText: z.string().trim().max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image details." };
  const { slot, objectKey, altText } = parsed.data;
  if (!objectKey.startsWith(`${keyPrefix(slot)}/`) || objectKey.includes("..")) return { ok: false, error: "Invalid image." };
  if (!(await slotExists(slot))) return { ok: false, error: "That section no longer exists." };
  if (!(await headObject("public", objectKey))) return { ok: false, error: "Upload not found. Please try again." };

  const prisma = getPrisma();
  const previous = await prisma.siteImage.findUnique({ where: { slot } });
  const data = { objectKey, url: publicUrlFor(objectKey), altText: altText || "ORACK streetwear" };
  await prisma.siteImage.upsert({ where: { slot }, update: data, create: { slot, ...data } });
  // The replaced file is no longer referenced anywhere.
  if (previous && previous.objectKey !== objectKey) await deleteObject("public", previous.objectKey).catch(() => undefined);
  await logActivity({ userId: auth.user.id, action: "site_image.set", entityType: "SiteImage", entityId: slot });
  refreshStorefront(SITE_IMAGES_TAG);
  return { ok: true };
}

export async function updateSiteImageAlt(slot: string, altText: string): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  if (!isValidSlotShape(slot)) return { ok: false, error: "Unknown image slot" };
  const res = await getPrisma().siteImage.updateMany({ where: { slot }, data: { altText: altText.trim().slice(0, 200) || "ORACK streetwear" } });
  if (!res.count) return { ok: false, error: "Image not found." };
  refreshStorefront(SITE_IMAGES_TAG);
  return { ok: true };
}

/** Back to the built-in artwork. */
export async function removeSiteImage(slot: string): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  if (!isValidSlotShape(slot)) return { ok: false, error: "Unknown image slot" };
  const prisma = getPrisma();
  const existing = await prisma.siteImage.findUnique({ where: { slot } });
  if (!existing) return { ok: true };
  await prisma.siteImage.delete({ where: { slot } });
  if (isR2Configured()) await deleteObject("public", existing.objectKey).catch(() => undefined);
  await logActivity({ userId: auth.user.id, action: "site_image.remove", entityType: "SiteImage", entityId: slot });
  refreshStorefront(SITE_IMAGES_TAG);
  return { ok: true };
}
