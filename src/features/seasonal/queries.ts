import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SETTINGS_TAG } from "@/features/settings/queries";
import { getPrisma } from "@/lib/prisma";
import { isSeasonLive, parseSeasonal, sriLankaToday, type SeasonalSettings } from "./config";

/**
 * Seasonal settings plus whether they're live today. Cached for an hour at most, so a season
 * starts or ends within the hour of its date; the falling effect re-checks the date in the browser.
 */
export async function getSeasonal(): Promise<{ settings: SeasonalSettings; live: boolean }> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const row = await getPrisma().businessSetting.findUnique({ where: { id: 1 }, select: { seasonal: true } });
  const settings = parseSeasonal(row?.seasonal);
  return { settings, live: isSeasonLive(settings, sriLankaToday()) };
}
