import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { discountedPrice, validDiscount } from "./pricing";
import { compareSizes, sortProducts } from "./sort";
import { toneFromHex } from "./tones";
import { PRINT_STYLES, type CategoryRef, type ColourOption, type PrintStyle, type Product } from "./types";

/**
 * Storefront catalogue reads. Cached across requests and tagged so admin edits
 * refresh them immediately (see CATALOG_TAG in admin actions). Stock shown here
 * may be a little stale; the order service always re-checks it in a transaction.
 */
export const CATALOG_TAG = "catalog";

const productInclude = {
  category: { select: { slug: true, name: true } },
  variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
  images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProduct(row: ProductRow): Product {
  const basePrice = row.basePrice.toNumber();
  const discountPercent = validDiscount(row.discountPercent);
  const colours: ColourOption[] = [];
  for (const v of row.variants) {
    if (!colours.some((c) => c.name === v.colorName)) colours.push({ name: v.colorName, hex: v.colorHex, tone: toneFromHex(v.colorHex) });
  }
  const variants = row.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    colorName: v.colorName,
    price: discountedPrice(v.price?.toNumber() ?? basePrice, discountPercent),
    compareAtPrice: v.price?.toNumber() ?? basePrice,
    stock: v.stockQuantity,
  }));
  const sizes = [...new Set(variants.map((v) => v.size))].sort(compareSizes);
  const print = (PRINT_STYLES as string[]).includes(row.artPrint) ? (row.artPrint as PrintStyle) : "chest";

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    kind: row.category.slug.includes("hood") ? "hoodie" : "tee",
    print,
    price: discountedPrice(basePrice, discountPercent),
    minPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : discountedPrice(basePrice, discountPercent),
    compareAtMinPrice: variants.length ? Math.min(...variants.map((v) => v.compareAtPrice)) : basePrice,
    discountPercent,
    colours,
    sizes,
    variants,
    images: row.images.map((i) => ({ id: i.id, url: i.url, alt: i.altText, colorName: i.colorName })),
    tag: discountPercent ? `-${discountPercent}%` : row.isNewArrival ? "New" : row.isCustomizable ? "Customizable" : undefined,
    isFeatured: row.isFeatured,
    isNewArrival: row.isNewArrival,
    isCustomizable: row.isCustomizable,
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadActiveProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const rows = await getPrisma().product.findMany({
    where: { status: "ACTIVE", category: { isActive: true } },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  // A product with no active variants can't be bought, so it isn't listed.
  return rows.map(toProduct).filter((p) => p.variants.length > 0);
}

export async function getCategories(): Promise<CategoryRef[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return getPrisma().category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } });
}

export interface HomeCategory {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  productCount: number;
}

/** Visible categories that have something to buy, for the homepage cards and navigation. */
export async function getShopCategories(): Promise<HomeCategory[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const [categories, products] = await Promise.all([
    getPrisma().category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true, tagline: true } }),
    loadActiveProducts(),
  ]);
  return categories
    .map((c) => ({ ...c, productCount: products.filter((p) => p.category.slug === c.slug).length }))
    .filter((c) => c.productCount > 0);
}

export async function getProducts(): Promise<Product[]> {
  return sortProducts(await loadActiveProducts(), "featured");
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return (await loadActiveProducts()).filter((p) => p.isFeatured);
}

export async function getNewArrivals(): Promise<Product[]> {
  return sortProducts((await loadActiveProducts()).filter((p) => p.isNewArrival), "newest");
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await loadActiveProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getCustomizableProducts(): Promise<Product[]> {
  return (await loadActiveProducts()).filter((p) => p.isCustomizable);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await loadActiveProducts()).map((p) => p.slug);
}
