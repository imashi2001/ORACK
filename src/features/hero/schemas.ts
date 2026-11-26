import { z } from "zod";

export const HERO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_HERO_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_HERO_SLIDES = 6;

/** Which part of the photo stays in frame when the hero crops it (CSS object-position). */
export const HERO_FOCUS = ["center", "top", "bottom", "left", "right"] as const;
export type HeroFocus = (typeof HERO_FOCUS)[number];

export const heroUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(HERO_IMAGE_TYPES),
  size: z.number().int().positive().max(MAX_HERO_IMAGE_BYTES, "Hero images must be 12 MB or smaller"),
});

export const attachHeroSchema = z.object({
  objectKey: z.string().min(1).max(300),
  altText: z.string().trim().max(200),
  focus: z.enum(HERO_FOCUS),
  monochrome: z.boolean(),
});

export const updateHeroSchema = z.object({
  altText: z.string().trim().max(200),
  focus: z.enum(HERO_FOCUS),
  monochrome: z.boolean(),
  isActive: z.boolean(),
});
