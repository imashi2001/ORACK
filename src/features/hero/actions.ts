"use server";

import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction, SETTINGS_ROLES } from "@/features/auth/dal";
import { refreshStorefront } from "@/features/products/refresh";
import { getPrisma } from "@/lib/prisma";
import { deleteObject, headObject, isR2Configured, makeObjectKey, presignUpload, publicUrlFor } from "@/lib/r2";
import { HERO_TAG } from "./queries";
import { attachHeroSchema, heroUploadRequestSchema, MAX_HERO_SLIDES, updateHeroSchema } from "./schemas";

const PREFIX = "hero/";

export async function requestHeroUpload(input: unknown): Promise<ActionResult<{ uploadUrl: string; objectKey: string }>> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  if (!isR2Configured("public")) return { ok: false, error: "Image storage isn't configured yet. Add the R2_* variables to your environment." };
  const parsed = heroUploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  if ((await getPrisma().heroSlide.count()) >= MAX_HERO_SLIDES) return { ok: false, error: `You can have up to ${MAX_HERO_SLIDES} hero images. Delete one first.` };

  const objectKey = makeObjectKey("hero", parsed.data.contentType);
  const uploadUrl = await presignUpload("public", objectKey, parsed.data.contentType, parsed.data.size);
  return { ok: true, data: { uploadUrl, objectKey } };
}

export async function attachHeroImage(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = attachHeroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image details." };
  const { objectKey, altText, focus } = parsed.data;
  // Only keys we issued, and only once the upload really exists in the bucket.
  if (!objectKey.startsWith(PREFIX) || objectKey.includes("..")) return { ok: false, error: "Invalid image." };
  const head = await headObject("public", objectKey);
  if (!head) return { ok: false, error: "Upload not found. Please try again." };

  const prisma = getPrisma();
  const last = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
  const slide = await prisma.heroSlide.create({
    data: { objectKey, url: publicUrlFor(objectKey), altText: altText || "ORACK streetwear", focus, sortOrder: (last._max.sortOrder ?? -1) + 1, sizeBytes: head.size, mimeType: head.contentType },
  });
  await logActivity({ userId: auth.user.id, action: "hero.add", entityType: "HeroSlide", entityId: slide.id });
  refreshStorefront(HERO_TAG);
  return { ok: true };
}

export async function updateHeroSlide(id: string, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const parsed = updateHeroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid details." };
  const res = await getPrisma().heroSlide.updateMany({ where: { id }, data: { ...parsed.data, altText: parsed.data.altText || "ORACK streetwear" } });
  if (!res.count) return { ok: false, error: "Image not found." };
  await logActivity({ userId: auth.user.id, action: "hero.update", entityType: "HeroSlide", entityId: id });
  refreshStorefront(HERO_TAG);
  return { ok: true };
}

/** Swaps the slide with its neighbour so admins can reorder with up/down buttons. */
export async function moveHeroSlide(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const prisma = getPrisma();
  const slides = await prisma.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = slides.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= slides.length) return { ok: true };
  [slides[i], slides[j]] = [slides[j], slides[i]];
  await prisma.$transaction(slides.map((s, order) => prisma.heroSlide.update({ where: { id: s.id }, data: { sortOrder: order } })));
  refreshStorefront(HERO_TAG);
  return { ok: true };
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  const auth = await authorizeAction(SETTINGS_ROLES);
  if (!auth.ok) return auth;
  const prisma = getPrisma();
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) return { ok: false, error: "Image not found." };
  await prisma.heroSlide.delete({ where: { id } });
  if (isR2Configured()) await deleteObject("public", slide.objectKey).catch(() => undefined);
  await logActivity({ userId: auth.user.id, action: "hero.delete", entityType: "HeroSlide", entityId: id });
  refreshStorefront(HERO_TAG);
  return { ok: true };
}
