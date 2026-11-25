import { describe, expect, it } from "vitest";
import { rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { generateReference } from "@/lib/reference";

describe("generateReference", () => {
  it("uses the PREFIX-YYMMDD-XXXXX format without ambiguous letters", () => {
    const ref = generateReference("ORK", new Date("2026-11-25T10:00:00"));
    expect(ref).toMatch(/^ORK-261125-[0-9A-HJKMNP-TV-Z]{5}$/);
    expect(generateReference("CUS")).toMatch(/^CUS-\d{6}-/);
  });

  it("is effectively unique", () => {
    const refs = new Set(Array.from({ length: 5000 }, () => generateReference("ORK")));
    expect(refs.size).toBeGreaterThan(4990);
  });
});

describe("rateLimitKey", () => {
  it("hashes the identifier so raw IPs are never stored", () => {
    const key = rateLimitKey(RATE_LIMITS.placeOrder, "203.0.113.7");
    expect(key).toMatch(/^order:[0-9a-f]{32}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(rateLimitKey(RATE_LIMITS.placeOrder, "203.0.113.7")).toBe(key);
    expect(rateLimitKey(RATE_LIMITS.customRequest, "203.0.113.7")).not.toBe(key);
  });
});
