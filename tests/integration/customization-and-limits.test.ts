import { beforeEach, describe, expect, it } from "vitest";
import { isLoginThrottled, recordLoginAttempt } from "@/features/auth/throttle";
import { createCustomizationRequest, verifyCustomizationUploads } from "@/features/customization/service";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasTestDb, resetDb, seedCatalog, uuid } from "./helpers";

describe.skipIf(!hasTestDb)("custom requests (real database)", () => {
  beforeEach(resetDb);

  const base = {
    productSlug: "test-tee",
    colorName: "Black",
    size: "M",
    quantity: 10,
    placements: ["FRONT", "BACK"],
    designDescription: "Team logo on the back",
    customerName: "Kasun",
    customerPhone: "0712345678",
    images: [{ name: "logo.png", type: "image/png" as const, size: 1200 }],
  };

  it("saves a quote request separately from orders, and is idempotent", async () => {
    const { product } = await seedCatalog();
    const input = { ...base, idempotencyKey: uuid(1), productId: product.id, productName: product.name };
    const first = await createCustomizationRequest(input);
    const again = await createCustomizationRequest(input);

    expect(again.reference).toBe(first.reference);
    expect(first.reference).toMatch(/^CUS-/);
    // Image storage is off in tests, so images are dropped rather than left pending.
    expect(first.imageStorageAvailable).toBe(false);
    expect(first.uploads).toEqual([]);

    const prisma = getPrisma();
    expect(await prisma.customizationRequest.count()).toBe(1);
    expect(await prisma.order.count()).toBe(0);
    const saved = await prisma.customizationRequest.findUniqueOrThrow({ where: { id: first.requestId } });
    expect(saved).toMatchObject({ status: "NEW_REQUEST", productNameSnapshot: "Test Tee", placements: ["FRONT", "BACK"] });
  });

  it("only lets the holder of the idempotency key confirm uploads", async () => {
    const { product } = await seedCatalog();
    const req = await createCustomizationRequest({ ...base, idempotencyKey: uuid(2), productId: product.id, productName: product.name });
    expect(await verifyCustomizationUploads(req.requestId, uuid(999))).toBeNull();
    const ok = await verifyCustomizationUploads(req.requestId, uuid(2));
    expect(ok?.request.reference).toBe(req.reference);
  });
});

describe.skipIf(!hasTestDb)("rate limiting and login throttling", () => {
  beforeEach(resetDb);

  it("allows up to the limit per window, then blocks, then resets in the next window", async () => {
    const rule = { name: "test", limit: 3, windowMs: 60_000 };
    const t = Date.UTC(2026, 0, 1, 12, 0, 0);
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await checkRateLimit(rule, "1.2.3.4", t)).allowed);
    expect(results).toEqual([true, true, true, false]);
    expect((await checkRateLimit(rule, "5.6.7.8", t)).allowed).toBe(true);
    expect((await checkRateLimit(rule, "1.2.3.4", t + 60_000)).allowed).toBe(true);
  });

  it("counts concurrent requests atomically", async () => {
    const rule = { name: "burst", limit: 5, windowMs: 60_000 };
    const results = await Promise.all(Array.from({ length: 12 }, () => checkRateLimit(rule, "9.9.9.9")));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("pauses an email after 5 failed logins and an IP after 20", async () => {
    for (let i = 0; i < 4; i++) await recordLoginAttempt("a@test.dev", "10.0.0.1", false);
    expect(await isLoginThrottled("a@test.dev", "10.0.0.1")).toBe(false);
    await recordLoginAttempt("a@test.dev", "10.0.0.1", false);
    expect(await isLoginThrottled("a@test.dev", "10.0.0.1")).toBe(true);
    // Successful logins don't count.
    await recordLoginAttempt("b@test.dev", "10.0.0.2", true);
    expect(await isLoginThrottled("b@test.dev", "10.0.0.2")).toBe(false);

    for (let i = 0; i < 20; i++) await recordLoginAttempt(`user${i}@test.dev`, "10.0.0.3", false);
    expect(await isLoginThrottled("fresh@test.dev", "10.0.0.3")).toBe(true);
  });
});
