import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import type { HeroFocus } from "./schemas";

export const HERO_TAG = "hero";

export interface HeroSlideView {
  id: string;
  url: string;
  altText: string;
  focus: HeroFocus;
  monochrome: boolean;
}

/** Active hero images for the homepage, in display order. */
export async function getHeroSlides(): Promise<HeroSlideView[]> {
  "use cache";
  cacheTag(HERO_TAG);
  cacheLife("hours");
  const rows = await getPrisma().heroSlide.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, altText: true, focus: true, monochrome: true },
  });
  return rows.map((r) => ({ ...r, focus: r.focus as HeroFocus }));
}

export function getAllHeroSlidesForAdmin() {
  return getPrisma().heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}
export type AdminHeroSlide = Awaited<ReturnType<typeof getAllHeroSlidesForAdmin>>[number];
