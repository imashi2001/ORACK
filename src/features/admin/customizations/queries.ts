import "server-only";
import type { CustomizationStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { isR2Configured, presignDownload } from "@/lib/r2";

export const CUSTOMIZATIONS_PAGE_SIZE = 20;

export async function listCustomizations(f: { q?: string; status?: CustomizationStatus; page?: number }) {
  const digits = f.q?.replace(/\D/g, "") ?? "";
  const where: Prisma.CustomizationRequestWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.q
      ? {
          OR: [
            { reference: { contains: f.q.trim(), mode: "insensitive" } },
            { customerName: { contains: f.q.trim(), mode: "insensitive" } },
            { productNameSnapshot: { contains: f.q.trim(), mode: "insensitive" } },
            ...(digits.length >= 4 ? [{ customerPhone: { contains: digits.replace(/^94/, "0") } }] : []),
          ],
        }
      : {}),
  };
  const page = Math.max(1, f.page ?? 1);
  const prisma = getPrisma();
  const [total, rows] = await Promise.all([
    prisma.customizationRequest.count({ where }),
    prisma.customizationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMIZATIONS_PAGE_SIZE,
      take: CUSTOMIZATIONS_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        customerName: true,
        customerPhone: true,
        productNameSnapshot: true,
        quantity: true,
        status: true,
        createdAt: true,
        _count: { select: { images: { where: { status: "UPLOADED" } } } },
      },
    }),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / CUSTOMIZATIONS_PAGE_SIZE)), rows: rows.map((r) => ({ ...r, imageCount: r._count.images })) };
}

/** Full request for the admin, with short-lived signed URLs for its private images. */
export async function getCustomizationDetail(id: string) {
  const r = await getPrisma().customizationRequest.findUnique({
    where: { id },
    include: {
      images: { orderBy: { createdAt: "asc" } },
      quotations: { orderBy: { version: "desc" }, include: { createdBy: { select: { name: true } } } },
      order: { select: { id: true, reference: true, status: true } },
      product: { select: { id: true, name: true } },
    },
  });
  if (!r) return null;

  const storage = isR2Configured("private");
  const images = await Promise.all(
    r.images.map(async (img) => ({
      id: img.id,
      fileName: img.originalFileName,
      sizeBytes: img.sizeBytes,
      status: img.status,
      // Signed GET URL valid for 5 minutes; the bucket itself is never public.
      url: storage && img.status === "UPLOADED" ? await presignDownload("private", img.objectKey, 300) : null,
    })),
  );

  return {
    ...r,
    images,
    quotations: r.quotations.map((q) => ({
      ...q,
      unitPrice: q.unitPrice.toNumber(),
      setupFee: q.setupFee.toNumber(),
      deliveryFee: q.deliveryFee.toNumber(),
      total: q.total.toNumber(),
    })),
  };
}

export type CustomizationDetail = NonNullable<Awaited<ReturnType<typeof getCustomizationDetail>>>;
