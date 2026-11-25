import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DesignPlacement } from "@/generated/prisma/enums";
import { getPrisma } from "@/lib/prisma";
import { deleteObject, headObject, isR2Configured, makeObjectKey, presignUpload } from "@/lib/r2";
import { generateReference } from "@/lib/reference";
import { MAX_IMAGE_BYTES, type SubmitCustomizationInput } from "./schemas";

/**
 * Customization requests are quote requests, never orders. They live in their own
 * table; an admin can later create an Order from an accepted quotation, and the
 * request keeps a link to it.
 *
 * Reference images go to the PRIVATE R2 bucket. The browser uploads straight to R2
 * with short-lived presigned PUT URLs (size and type are part of the signature), then
 * the server checks each object exists before marking it UPLOADED.
 *
 * The client-generated idempotency key doubles as the customer's proof of ownership
 * for the upload-confirmation step, since customers don't have accounts.
 */

const UPLOAD_URL_TTL_SECONDS = 600;

export async function createCustomizationRequest(
  data: SubmitCustomizationInput & { customerPhone: string; productId: string; productName: string },
): Promise<{ requestId: string; reference: string; uploads: { index: number; uploadUrl: string }[]; imageStorageAvailable: boolean }> {
  const prisma = getPrisma();
  const imageStorageAvailable = isR2Configured("private");
  const images = imageStorageAvailable ? data.images : [];

  const existing = await prisma.customizationRequest.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (existing) {
    // Retried submit: hand out fresh URLs for images that never arrived.
    const uploads = await Promise.all(
      existing.images.map(async (img, index) =>
        img.status === "PENDING" ? { index, uploadUrl: await presignUpload("private", img.objectKey, img.mimeType, img.sizeBytes, UPLOAD_URL_TTL_SECONDS) } : null,
      ),
    );
    return { requestId: existing.id, reference: existing.reference, uploads: uploads.filter((u) => u !== null), imageStorageAvailable };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = generateReference("CUS");
    try {
      const request = await prisma.$transaction(async (tx) => {
        const created = await tx.customizationRequest.create({
          data: {
            reference,
            idempotencyKey: data.idempotencyKey,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            productId: data.productId,
            productNameSnapshot: data.productName,
            size: data.size,
            colorName: data.colorName,
            quantity: data.quantity,
            placements: data.placements as DesignPlacement[],
            designDescription: data.designDescription,
            additionalInstructions: data.additionalInstructions || null,
          },
        });
        const rows = images.map((img) => ({
          requestId: created.id,
          objectKey: makeObjectKey(`customizations/${created.id}`, img.type),
          originalFileName: img.name.slice(0, 200),
          mimeType: img.type,
          sizeBytes: img.size,
        }));
        // Created one by one so createdAt order matches the browser's file order (used on retries).
        for (const row of rows) await tx.customizationImage.create({ data: row });
        return { id: created.id, reference: created.reference, rows };
      });

      const uploads = await Promise.all(
        request.rows.map(async (row, index) => ({ index, uploadUrl: await presignUpload("private", row.objectKey, row.mimeType, row.sizeBytes, UPLOAD_URL_TTL_SECONDS) })),
      );
      return { requestId: request.id, reference: request.reference, uploads, imageStorageAvailable };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = JSON.stringify(e.meta ?? {});
        if (target.includes("idempotencyKey")) return createCustomizationRequest(data); // concurrent double submit
        if (target.includes("reference")) continue;
      }
      throw e;
    }
  }
  throw new Error("Could not allocate a request reference");
}

/** Checks each PENDING image actually reached R2 and marks it UPLOADED or REJECTED. */
export async function verifyCustomizationUploads(requestId: string, idempotencyKey: string) {
  const prisma = getPrisma();
  const request = await prisma.customizationRequest.findFirst({
    where: { id: requestId, idempotencyKey },
    include: { images: true, product: { select: { name: true } } },
  });
  if (!request) return null;

  if (isR2Configured("private")) {
    for (const img of request.images.filter((i) => i.status === "PENDING")) {
      const head = await headObject("private", img.objectKey);
      if (!head) continue; // not uploaded (yet); stays PENDING
      const valid = head.size > 0 && head.size <= MAX_IMAGE_BYTES && head.contentType === img.mimeType;
      await prisma.customizationImage.update({ where: { id: img.id }, data: { status: valid ? "UPLOADED" : "REJECTED", sizeBytes: head.size } });
      if (!valid) await deleteObject("private", img.objectKey).catch(() => undefined);
      img.status = valid ? "UPLOADED" : "REJECTED";
    }
  }

  return {
    request,
    uploadedCount: request.images.filter((i) => i.status === "UPLOADED").length,
    failedCount: request.images.filter((i) => i.status !== "UPLOADED").length,
  };
}
