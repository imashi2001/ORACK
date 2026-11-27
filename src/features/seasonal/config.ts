import { z } from "zod";

export const EFFECTS = ["none", "snow", "confetti", "hearts", "sparkles"] as const;
export const INTENSITIES = ["light", "medium", "heavy"] as const;
export const LIGHTS = ["off", "warm", "colour"] as const;
export const PRESETS = ["christmas", "newyear", "valentine", "avurudu", "custom"] as const;

export type Effect = (typeof EFFECTS)[number];
export type Intensity = (typeof INTENSITIES)[number];
export type Lights = (typeof LIGHTS)[number];
export type Preset = (typeof PRESETS)[number];

const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date")]);

export const seasonalSchema = z
  .object({
    enabled: z.boolean(),
    preset: z.enum(PRESETS),
    effect: z.enum(EFFECTS),
    intensity: z.enum(INTENSITIES),
    lights: z.enum(LIGHTS),
    bannerEnabled: z.boolean(),
    bannerText: z.string().trim().max(120),
    bannerLink: z.union([z.literal(""), z.string().trim().max(200).regex(/^\/[^\s]*$/, "Use a link on this site, starting with /")]),
    /** Show falling effects on phones too (they're lighter there). */
    onMobile: z.boolean(),
    /** Optional schedule (Sri Lanka dates, inclusive). Empty = no limit. */
    startsOn: isoDate,
    endsOn: isoDate,
  })
  .refine((v) => !v.startsOn || !v.endsOn || v.startsOn <= v.endsOn, { message: "The end date must be after the start date", path: ["endsOn"] })
  .refine((v) => !v.bannerEnabled || v.bannerText.length > 0, { message: "Write the banner message", path: ["bannerText"] });

export type SeasonalSettings = z.infer<typeof seasonalSchema>;

export const PRESET_INFO: Record<Preset, { label: string; emoji: string; defaults: Partial<SeasonalSettings> }> = {
  christmas: { label: "Christmas", emoji: "🎄", defaults: { effect: "snow", lights: "colour", bannerText: "Merry Christmas from ORACK. Gift something bold this season." } },
  newyear: { label: "New Year", emoji: "🎆", defaults: { effect: "confetti", lights: "warm", bannerText: "Happy New Year! New year, new fits." } },
  valentine: { label: "Valentine's", emoji: "❤️", defaults: { effect: "hearts", lights: "off", bannerText: "Matching fits for you and yours this Valentine's." } },
  avurudu: { label: "Avurudu", emoji: "🌅", defaults: { effect: "sparkles", lights: "warm", bannerText: "Suba Aluth Avuruddak Wewa! Iniya Puthandu Vazhthukkal!" } },
  custom: { label: "Custom", emoji: "✨", defaults: {} },
};

export const DEFAULT_SEASONAL: SeasonalSettings = {
  enabled: false,
  preset: "christmas",
  effect: "snow",
  intensity: "medium",
  lights: "colour",
  bannerEnabled: true,
  bannerText: PRESET_INFO.christmas.defaults.bannerText!,
  bannerLink: "/products",
  onMobile: true,
  startsOn: "",
  endsOn: "",
};

export function parseSeasonal(value: unknown): SeasonalSettings {
  const parsed = seasonalSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_SEASONAL;
}

/** Today's date in Sri Lanka as YYYY-MM-DD. */
export function sriLankaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whether the decorations should be showing on the given day. */
export function isSeasonLive(s: SeasonalSettings, today: string): boolean {
  if (!s.enabled) return false;
  if (s.startsOn && today < s.startsOn) return false;
  if (s.endsOn && today > s.endsOn) return false;
  return true;
}
