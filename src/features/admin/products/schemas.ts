import { z } from "zod";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const price = z.number({ error: "Enter a price" }).positive("Price must be more than 0").max(1_000_000).multipleOf(0.01, "Use at most 2 decimals");

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  slug: z.string().trim().min(2).max(120).regex(SLUG_RE, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().min(10, "Add a short description (10+ characters)").max(4000),
  categoryId: z.string().min(1, "Choose a category"),
  basePrice: price,
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isCustomizable: z.boolean(),
  artPrint: z.enum(["chest", "back", "graphic", "sleeve", "none"]),
});
export type ProductInput = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(10).transform((s) => s.toUpperCase()),
  colorName: z.string().trim().min(1, "Colour is required").max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #111111"),
  price: price.nullable(),
  stockQuantity: z.number().int("Whole numbers only").min(0).max(100_000),
  sku: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Letters, numbers and hyphens only")
    .transform((s) => s.toUpperCase())
    .optional(),
  isActive: z.boolean(),
});
export type VariantInput = z.input<typeof variantSchema>;

export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;

export const imageUploadRequestSchema = z.object({
  productId: z.string().min(1),
  fileName: z.string().min(1).max(200),
  contentType: z.enum(PRODUCT_IMAGE_TYPES),
  size: z.number().int().positive().max(MAX_PRODUCT_IMAGE_BYTES, "Images must be 8 MB or smaller"),
});

export const attachImageSchema = z.object({
  productId: z.string().min(1),
  objectKey: z.string().min(1).max(300),
  altText: z.string().trim().max(200),
  colorName: z.string().trim().max(40).nullable(),
});
