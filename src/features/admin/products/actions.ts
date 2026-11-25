"use server";

import { refreshStorefront } from "@/features/products/refresh";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction, CATALOG_ROLES } from "@/features/auth/dal";
import { CATALOG_TAG } from "@/features/products/queries";
import { getPrisma } from "@/lib/prisma";
import { deleteObject, headObject, isR2Configured, makeObjectKey, presignUpload, publicUrlFor } from "@/lib/r2";
import { getRequestMeta } from "@/lib/request";
import { attachImageSchema, imageUploadRequestSchema, productSchema, variantSchema } from "./schemas";

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

function uniqueFieldError(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return JSON.stringify(e.meta ?? {});
  return null;
}

// ── Products ───────────────────────────────────────────────────────────────

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  try {
    const product = await getPrisma().product.create({ data: parsed.data });
    await logActivity({ userId: auth.user.id, action: "product.create", entityType: "Product", entityId: product.id, metadata: { name: product.name }, ipAddress: (await getRequestMeta()).ipAddress });
    refreshStorefront(CATALOG_TAG);
    return { ok: true, data: { id: product.id } };
  } catch (e) {
    if (uniqueFieldError(e)?.includes("slug")) return { ok: false, error: "That URL slug is already used.", fieldErrors: { slug: ["Already used by another product"] } };
    throw e;
  }
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  try {
    await getPrisma().product.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (uniqueFieldError(e)?.includes("slug")) return { ok: false, error: "That URL slug is already used.", fieldErrors: { slug: ["Already used by another product"] } };
    throw e;
  }
  await logActivity({ userId: auth.user.id, action: "product.update", entityType: "Product", entityId: id, metadata: { status: parsed.data.status } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true, message: "Product saved." };
}

/** Deletes a product. Past orders keep their snapshot (name, size, colour, price). */
export async function deleteProduct(id: string): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id }, include: { images: { select: { objectKey: true } } } });
  if (!product) return { ok: false, error: "Product not found." };

  await prisma.product.delete({ where: { id } });
  if (isR2Configured()) {
    await Promise.allSettled(product.images.map((i) => deleteObject("public", i.objectKey)));
  }
  await logActivity({ userId: auth.user.id, action: "product.delete", entityType: "Product", entityId: id, metadata: { name: product.name } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

// ── Variants ───────────────────────────────────────────────────────────────

function autoSku(productSlug: string, colorName: string, size: string) {
  const part = (s: string, n: number) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, n).toUpperCase();
  return `ORK-${part(productSlug, 6)}-${part(colorName, 3)}-${part(size, 4)}`;
}

export async function saveVariant(productId: string, variantId: string | null, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the variant fields.", fieldErrors: fieldErrors(parsed.error) };
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { ok: false, error: "Product not found." };

  const { sku, ...rest } = parsed.data;
  const data = { ...rest, sku: sku || autoSku(product.slug, rest.colorName, rest.size) };
  try {
    if (variantId) {
      await prisma.productVariant.update({ where: { id: variantId, productId }, data });
    } else {
      await prisma.productVariant.create({ data: { ...data, productId } });
    }
  } catch (e) {
    const target = uniqueFieldError(e);
    if (target?.includes("sku")) return { ok: false, error: "That SKU is already used.", fieldErrors: { sku: ["Already used"] } };
    if (target) return { ok: false, error: `A ${rest.colorName} / ${rest.size} variant already exists for this product.` };
    throw e;
  }
  await logActivity({ userId: auth.user.id, action: variantId ? "variant.update" : "variant.create", entityType: "Product", entityId: productId, metadata: { size: rest.size, colorName: rest.colorName, stock: rest.stockQuantity } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

/** Quick stock edit from the variants table. */
export async function setVariantStock(productId: string, variantId: string, stockQuantity: number): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const qty = z.number().int().min(0).max(100_000).safeParse(stockQuantity);
  if (!qty.success) return { ok: false, error: "Stock must be a whole number from 0." };
  await getPrisma().productVariant.update({ where: { id: variantId, productId }, data: { stockQuantity: qty.data } });
  await logActivity({ userId: auth.user.id, action: "variant.stock", entityType: "ProductVariant", entityId: variantId, metadata: { stock: qty.data } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

export async function deleteVariant(productId: string, variantId: string): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  await getPrisma().productVariant.delete({ where: { id: variantId, productId } });
  await logActivity({ userId: auth.user.id, action: "variant.delete", entityType: "Product", entityId: productId, metadata: { variantId } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

/** Creates every size × colour combination that doesn't exist yet. */
export async function generateVariants(productId: string, input: unknown): Promise<ActionResult<{ created: number }>> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = z
    .object({
      sizes: z.array(z.string().trim().min(1).max(10)).min(1, "Pick at least one size").max(12),
      colours: z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).min(1, "Add at least one colour").max(12),
      stockQuantity: z.number().int().min(0).max(100_000),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { ok: false, error: "Product not found." };

  const rows = parsed.data.colours.flatMap((c) =>
    parsed.data.sizes.map((size) => ({
      productId,
      size: size.toUpperCase(),
      colorName: c.name,
      colorHex: c.hex,
      stockQuantity: parsed.data.stockQuantity,
      sku: autoSku(product.slug, c.name, size),
    })),
  );
  const res = await prisma.productVariant.createMany({ data: rows, skipDuplicates: true });
  await logActivity({ userId: auth.user.id, action: "variant.generate", entityType: "Product", entityId: productId, metadata: { created: res.count } });
  refreshStorefront(CATALOG_TAG);
  return { ok: true, data: { created: res.count } };
}

// ── Images (Cloudflare R2, public bucket) ──────────────────────────────────

export async function requestProductImageUpload(input: unknown): Promise<ActionResult<{ uploadUrl: string; objectKey: string }>> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  if (!isR2Configured("public")) return { ok: false, error: "Image storage isn't configured yet. Add the R2_* variables to your environment." };
  const parsed = imageUploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  const exists = await getPrisma().product.count({ where: { id: parsed.data.productId } });
  if (!exists) return { ok: false, error: "Product not found." };

  const objectKey = makeObjectKey(`products/${parsed.data.productId}`, parsed.data.contentType);
  const uploadUrl = await presignUpload("public", objectKey, parsed.data.contentType, parsed.data.size);
  return { ok: true, data: { uploadUrl, objectKey } };
}

export async function attachProductImage(input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = attachImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image details." };
  const { productId, objectKey, altText, colorName } = parsed.data;
  // The key must be one we issued for this product, and the upload must really exist.
  if (!objectKey.startsWith(`products/${productId}/`)) return { ok: false, error: "Invalid image." };
  const head = await headObject("public", objectKey);
  if (!head) return { ok: false, error: "Upload not found. Please try again." };

  const prisma = getPrisma();
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, objectKey, url: publicUrlFor(objectKey), altText, colorName, sortOrder: count, isPrimary: count === 0, sizeBytes: head.size, mimeType: head.contentType },
  });
  await logActivity({ userId: auth.user.id, action: "image.add", entityType: "Product", entityId: productId });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  await getPrisma().$transaction([
    getPrisma().productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    getPrisma().productImage.update({ where: { id: imageId, productId }, data: { isPrimary: true } }),
  ]);
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

export async function deleteProductImage(productId: string, imageId: string): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const prisma = getPrisma();
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) return { ok: false, error: "Image not found." };
  await prisma.productImage.delete({ where: { id: imageId } });
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  if (isR2Configured()) await deleteObject("public", image.objectKey).catch(() => undefined);
  await logActivity({ userId: auth.user.id, action: "image.delete", entityType: "Product", entityId: productId });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}
