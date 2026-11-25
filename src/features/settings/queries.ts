import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import { getPrisma } from "@/lib/prisma";

export const SETTINGS_TAG = "settings";

export interface PublicSettings {
  businessName: string;
  whatsappNumber: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  deliveryInfo: string | null;
  announcement: string[];
}

/** Business settings for the storefront. Falls back to config defaults until an admin saves them. */
export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const row = await getPrisma().businessSetting.findUnique({ where: { id: 1 } });
  const announcement =
    row && row.announcementEnabled && row.announcementText
      ? row.announcementText.split("·").map((s) => s.trim()).filter(Boolean)
      : row
        ? []
        : [...siteConfig.announcement];
  return {
    businessName: row?.businessName ?? siteConfig.name,
    whatsappNumber: row?.whatsappNumber || siteConfig.whatsappNumber,
    contactEmail: row?.contactEmail ?? null,
    contactPhone: row?.contactPhone ?? null,
    address: row?.address ?? null,
    instagramUrl: row?.instagramUrl ?? null,
    facebookUrl: row?.facebookUrl ?? null,
    tiktokUrl: row?.tiktokUrl ?? null,
    deliveryInfo: row?.deliveryInfo ?? null,
    announcement,
  };
}
