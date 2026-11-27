import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/features/orders/order-service";
import { getPrisma } from "@/lib/prisma";
import { hasTestDb, resetDb, seedCatalog, uuid } from "./helpers";

const customer = { customerName: "Nimal Perera", customerPhone: "0771234567", deliveryAddress: "12 Galle Road, Colombo 03" };

describe.skipIf(!hasTestDb)("createOrder (real database)", () => {
  beforeEach(resetDb);

  it("saves the order with database prices and snapshots, and decrements stock", async () => {
    const { m, l } = await seedCatalog({ stockM: 5, stockL: 5 });
    const res = await createOrder({ ...customer, idempotencyKey: uuid(1), items: [{ variantId: m.id, quantity: 2 }, { variantId: l.id, quantity: 1 }] });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // M uses the base price 2500; L has a 2800 override.
    expect(res.order.total).toBe(2 * 2500 + 2800);
    expect(res.order.reference).toMatch(/^ORK-\d{6}-/);

    const prisma = getPrisma();
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.order.reference }, include: { items: true, statusHistory: true } });
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.items.map((i) => [i.productName, i.size, i.colorName, i.unitPrice.toNumber(), i.quantity]).sort()).toEqual([
      ["Test Tee", "L", "Black", 2800, 1],
      ["Test Tee", "M", "Black", 2500, 2],
    ]);
    expect(order.statusHistory).toHaveLength(1);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(3);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: l.id } })).stockQuantity).toBe(4);
  });

  it("merges duplicate lines for the same variant before checking stock", async () => {
    const { m } = await seedCatalog({ stockM: 3 });
    const res = await createOrder({ ...customer, idempotencyKey: uuid(2), items: [{ variantId: m.id, quantity: 2 }, { variantId: m.id, quantity: 2 }] });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.stockIssues?.[0]).toMatchObject({ requested: 4, available: 3 });
  });

  it("returns the same order for a repeated submit and doesn't take stock twice", async () => {
    const { m } = await seedCatalog({ stockM: 5 });
    const input = { ...customer, idempotencyKey: uuid(3), items: [{ variantId: m.id, quantity: 2 }] };
    const first = await createOrder(input);
    const again = await createOrder(input);
    expect(first.ok && again.ok && first.order.reference === again.order.reference).toBe(true);
    expect(await getPrisma().order.count()).toBe(1);
    expect((await getPrisma().productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(3);
  });

  it("handles a concurrent double submit with the same key", async () => {
    const { m } = await seedCatalog({ stockM: 5 });
    const input = { ...customer, idempotencyKey: uuid(4), items: [{ variantId: m.id, quantity: 1 }] };
    const results = await Promise.all([createOrder(input), createOrder(input), createOrder(input)]);
    const refs = new Set(results.map((r) => (r.ok ? r.order.reference : "error")));
    expect(refs.size).toBe(1);
    expect(refs.has("error")).toBe(false);
    expect(await getPrisma().order.count()).toBe(1);
    expect((await getPrisma().productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(4);
  });

  it("sells the last item exactly once when customers race", async () => {
    const { m } = await seedCatalog({ stockM: 1 });
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => createOrder({ ...customer, idempotencyKey: uuid(100 + i), items: [{ variantId: m.id, quantity: 1 }] })));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await getPrisma().order.count()).toBe(1);
    expect((await getPrisma().productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(0);
  });

  it("rolls back the whole order when one line is short", async () => {
    const { m, l } = await seedCatalog({ stockM: 5, stockL: 0 });
    const res = await createOrder({ ...customer, idempotencyKey: uuid(5), items: [{ variantId: m.id, quantity: 1 }, { variantId: l.id, quantity: 1 }] });
    expect(res.ok).toBe(false);
    expect(await getPrisma().order.count()).toBe(0);
    expect((await getPrisma().productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(5);
  });

  it("refuses inactive products, hidden variants and unknown variants", async () => {
    const { m, l } = await seedCatalog({ productStatus: "INACTIVE" });
    expect((await createOrder({ ...customer, idempotencyKey: uuid(6), items: [{ variantId: m.id, quantity: 1 }] })).ok).toBe(false);
    await getPrisma().product.updateMany({ data: { status: "ACTIVE" } });
    await getPrisma().productVariant.update({ where: { id: l.id }, data: { isActive: false } });
    expect((await createOrder({ ...customer, idempotencyKey: uuid(7), items: [{ variantId: l.id, quantity: 1 }] })).ok).toBe(false);
    expect((await createOrder({ ...customer, idempotencyKey: uuid(8), items: [{ variantId: "does-not-exist", quantity: 1 }] })).ok).toBe(false);
    expect(await getPrisma().order.count()).toBe(0);
  });

  it("keeps order history when the product is deleted later", async () => {
    const { m, product } = await seedCatalog();
    const res = await createOrder({ ...customer, idempotencyKey: uuid(9), items: [{ variantId: m.id, quantity: 1 }] });
    expect(res.ok).toBe(true);
    await getPrisma().product.delete({ where: { id: product.id } });
    const item = await getPrisma().orderItem.findFirstOrThrow();
    expect(item).toMatchObject({ productName: "Test Tee", size: "M", colorName: "Black", productId: null, variantId: null });
    expect(item.unitPrice.toNumber()).toBe(2500);
  });

  it("charges the product's discount, worked out on the server", async () => {
    const { product, m, l } = await seedCatalog();
    await getPrisma().product.update({ where: { id: product.id }, data: { discountPercent: 20 } });
    const res = await createOrder({ ...customer, idempotencyKey: uuid(40), items: [{ variantId: m.id, quantity: 1 }, { variantId: l.id, quantity: 1 }] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // 2500 → 2000 and the 2800 variant override → 2240
    expect(res.order.lines.map((x) => x.unitPrice).sort()).toEqual([2000, 2240]);
    expect(res.order.total).toBe(4240);
  });

  it("refuses items from a hidden (paused) category", async () => {
    const { category, m } = await seedCatalog();
    await getPrisma().category.update({ where: { id: category.id }, data: { isActive: false } });
    const res = await createOrder({ ...customer, idempotencyKey: uuid(41), items: [{ variantId: m.id, quantity: 1 }] });
    expect(res.ok).toBe(false);
    expect((await getPrisma().productVariant.findUniqueOrThrow({ where: { id: m.id } })).stockQuantity).toBe(5);
  });
});
