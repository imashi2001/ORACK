import "server-only";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function listAdminProducts(opts: { q?: string; status?: ProductStatus; categoryId?: string }) {
  const where: Prisma.ProductWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
    ...(opts.q
      ? { OR: [{ name: { contains: opts.q, mode: "insensitive" } }, { slug: { contains: opts.q, mode: "insensitive" } }, { variants: { some: { sku: { contains: opts.q, mode: "insensitive" } } } }] }
      : {}),
  };
  const rows = await getPrisma().product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      variants: { select: { stockQuantity: true, isActive: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    basePrice: p.basePrice.toNumber(),
    status: p.status,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isCustomizable: p.isCustomizable,
    variantCount: p.variants.length,
    totalStock: p.variants.filter((v) => v.isActive).reduce((n, v) => n + v.stockQuantity, 0),
    imageUrl: p.images[0]?.url ?? null,
    updatedAt: p.updatedAt,
  }));
}

export async function getAdminProduct(id: string) {
  const p = await getPrisma().product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ colorName: "asc" }, { createdAt: "asc" }] },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      _count: { select: { orderItems: true } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    basePrice: p.basePrice.toNumber(),
    status: p.status,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isCustomizable: p.isCustomizable,
    artPrint: p.artPrint as "chest" | "back" | "graphic" | "sleeve" | "none",
    orderCount: p._count.orderItems,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex,
      price: v.price?.toNumber() ?? null,
      stockQuantity: v.stockQuantity,
      isActive: v.isActive,
    })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText, colorName: i.colorName, isPrimary: i.isPrimary })),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function listCategoryOptions() {
  return getPrisma().category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } });
}
