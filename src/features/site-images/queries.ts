import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import type { SiteImageView } from "./slots";

export const SITE_IMAGES_TAG = "site-images";

/** Every uploaded storefront image, keyed by slot. Missing slots fall back to built-in artwork. */
export async function getSiteImages(): Promise<Record<string, SiteImageView>> {
  "use cache";
  cacheTag(SITE_IMAGES_TAG);
  cacheLife("hours");
  const rows = await getPrisma().siteImage.findMany({ select: { slot: true, url: true, altText: true } });
  return Object.fromEntries(rows.map((r) => [r.slot, { url: r.url, alt: r.altText }]));
}
