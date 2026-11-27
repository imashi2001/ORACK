import { describe, expect, it } from "vitest";
import { discountedPrice, validDiscount } from "@/features/products/pricing";
import { DEFAULT_SEASONAL, isSeasonLive, parseSeasonal, seasonalSchema, sriLankaToday } from "@/features/seasonal/config";

describe("discounts", () => {
  it("takes the percentage off and rounds to the rupee", () => {
    expect(discountedPrice(2500, 20)).toBe(2000);
    expect(discountedPrice(2999, 15)).toBe(2549); // 2549.15
    expect(discountedPrice(4700, 33)).toBe(3149);
  });

  it("ignores missing or out-of-range discounts", () => {
    for (const pct of [null, undefined, 0, -5, 91, 100, 12.5]) {
      expect(validDiscount(pct as number | null | undefined)).toBeNull();
      expect(discountedPrice(2500, pct as number | null | undefined)).toBe(2500);
    }
  });
});

describe("seasonal schedule", () => {
  const on = { ...DEFAULT_SEASONAL, enabled: true };

  it("is off unless enabled", () => {
    expect(isSeasonLive(DEFAULT_SEASONAL, "2026-12-25")).toBe(false);
    expect(isSeasonLive(on, "2026-12-25")).toBe(true);
  });

  it("respects inclusive start and end dates", () => {
    const xmas = { ...on, startsOn: "2026-12-01", endsOn: "2026-12-31" };
    expect(isSeasonLive(xmas, "2026-11-30")).toBe(false);
    expect(isSeasonLive(xmas, "2026-12-01")).toBe(true);
    expect(isSeasonLive(xmas, "2026-12-31")).toBe(true);
    expect(isSeasonLive(xmas, "2027-01-01")).toBe(false);
  });

  it("uses the Sri Lanka date", () => {
    // 20:00 UTC on 24 Dec is already 01:30 on 25 Dec in Colombo.
    expect(sriLankaToday(new Date("2026-12-24T20:00:00Z"))).toBe("2026-12-25");
  });

  it("rejects an end date before the start, and falls back to defaults for bad data", () => {
    expect(seasonalSchema.safeParse({ ...on, startsOn: "2026-12-10", endsOn: "2026-12-01" }).success).toBe(false);
    expect(parseSeasonal({ nonsense: true })).toEqual(DEFAULT_SEASONAL);
  });
});
