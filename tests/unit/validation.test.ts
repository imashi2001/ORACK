import { describe, expect, it } from "vitest";
import { slugify, productSchema, variantSchema, imageUploadRequestSchema } from "@/features/admin/products/schemas";
import { submitCustomizationSchema, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/features/customization/schemas";
import { placeOrderSchema } from "@/features/orders/schemas";
import { settingsSchema } from "@/features/settings/schemas";

const order = {
  customerName: "Nimal Perera",
  customerPhone: "077 123 4567",
  deliveryAddress: "12 Galle Road, Colombo 03",
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  items: [{ variantId: "v1", quantity: 2 }],
};

describe("placeOrderSchema", () => {
  it("accepts a valid order", () => {
    expect(placeOrderSchema.safeParse(order).success).toBe(true);
  });

  it("drops any price the browser tries to send", () => {
    const parsed = placeOrderSchema.parse({ ...order, total: 1, items: [{ variantId: "v1", quantity: 2, unitPrice: 1 }] });
    expect(parsed).not.toHaveProperty("total");
    expect(parsed.items[0]).not.toHaveProperty("unitPrice");
  });

  it.each([
    ["empty bag", { items: [] }],
    ["zero quantity", { items: [{ variantId: "v1", quantity: 0 }] }],
    ["huge quantity", { items: [{ variantId: "v1", quantity: 11 }] }],
    ["bad phone", { customerPhone: "12345" }],
    ["short address", { deliveryAddress: "Colombo" }],
    ["non-uuid key", { idempotencyKey: "abc" }],
    ["too many lines", { items: Array.from({ length: 21 }, (_, i) => ({ variantId: `v${i}`, quantity: 1 })) }],
  ])("rejects %s", (_label, patch) => {
    expect(placeOrderSchema.safeParse({ ...order, ...patch }).success).toBe(false);
  });
});

describe("customization request validation", () => {
  const req = {
    productSlug: "tee",
    colorName: "Black",
    size: "M",
    quantity: 10,
    placements: ["FRONT"],
    designDescription: "Team logo on the back",
    customerName: "Nimal",
    customerPhone: "0771234567",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    images: [{ name: "logo.png", type: "image/png", size: 1000 }],
  };

  it("accepts a valid request", () => {
    expect(submitCustomizationSchema.safeParse(req).success).toBe(true);
  });

  it.each([
    ["non-image file", { images: [{ name: "x.pdf", type: "application/pdf", size: 1000 }] }],
    ["svg (can carry scripts)", { images: [{ name: "x.svg", type: "image/svg+xml", size: 1000 }] }],
    ["oversized image", { images: [{ name: "x.png", type: "image/png", size: MAX_IMAGE_BYTES + 1 }] }],
    ["too many images", { images: Array.from({ length: MAX_IMAGES + 1 }, () => ({ name: "x.png", type: "image/png", size: 10 })) }],
    ["no placement", { placements: [] }],
    ["unknown placement", { placements: ["HAT"] }],
    ["tiny description", { designDescription: "logo" }],
  ])("rejects %s", (_label, patch) => {
    expect(submitCustomizationSchema.safeParse({ ...req, ...patch }).success).toBe(false);
  });
});

describe("admin validation", () => {
  it("slugifies names", () => {
    expect(slugify("  Signature Logo Tee — V2!  ")).toBe("signature-logo-tee-v2");
  });

  const product = { name: "Tee", slug: "tee", description: "A nice tee for tests.", categoryId: "c1", basePrice: 2500, status: "ACTIVE", isFeatured: false, isNewArrival: false, isCustomizable: false, artPrint: "chest" };
  it("validates products", () => {
    expect(productSchema.safeParse(product).success).toBe(true);
    expect(productSchema.safeParse({ ...product, slug: "Bad Slug" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, basePrice: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, basePrice: 10.555 }).success).toBe(false);
  });

  it("validates variants and upper-cases size and SKU", () => {
    const v = variantSchema.parse({ size: "xl", colorName: "Black", colorHex: "#111111", price: null, stockQuantity: 3, sku: "abc-1", isActive: true });
    expect(v.size).toBe("XL");
    expect(v.sku).toBe("ABC-1");
    expect(variantSchema.safeParse({ ...v, stockQuantity: -1 }).success).toBe(false);
    expect(variantSchema.safeParse({ ...v, colorHex: "red" }).success).toBe(false);
  });

  it("only allows raster product images up to 8 MB", () => {
    expect(imageUploadRequestSchema.safeParse({ productId: "p", fileName: "a.webp", contentType: "image/webp", size: 1000 }).success).toBe(true);
    expect(imageUploadRequestSchema.safeParse({ productId: "p", fileName: "a.svg", contentType: "image/svg+xml", size: 1000 }).success).toBe(false);
    expect(imageUploadRequestSchema.safeParse({ productId: "p", fileName: "a.png", contentType: "image/png", size: 9 * 1024 * 1024 }).success).toBe(false);
  });

  it("requires https social links and a valid WhatsApp number", () => {
    const base = { businessName: "ORACK", whatsappNumber: "077 123 4567", announcementEnabled: true };
    expect(settingsSchema.safeParse(base).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, instagramUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, instagramUrl: "http://instagram.com/x" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, whatsappNumber: "123" }).success).toBe(false);
  });
});
