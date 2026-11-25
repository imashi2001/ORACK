"use server";

import { z } from "zod";
import { getProductBySlug } from "@/features/products/queries";
import { getPublicSettings } from "@/features/settings/queries";
import { normaliseSriLankanMobile } from "@/lib/format";
import { log } from "@/lib/log";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { buildCustomizationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  finalizeCustomizationSchema,
  PLACEMENTS,
  submitCustomizationSchema,
  type FinalizeCustomizationResult,
  type SubmitCustomizationResult,
} from "./schemas";
import { createCustomizationRequest, verifyCustomizationUploads } from "./service";

/** Step 1: validate and save the request (status NEW_REQUEST); returns private upload URLs. */
export async function submitCustomizationRequest(input: unknown): Promise<SubmitCustomizationResult> {
  const parsed = submitCustomizationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const { ipAddress } = await getRequestMeta();
  const limit = await checkRateLimit(RATE_LIMITS.customRequest, ipAddress ?? "unknown");
  if (!limit.allowed) {
    log.warn("rate_limited", { action: "submitCustomizationRequest" });
    return { ok: false, error: `Too many requests from this connection. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes, or message us on WhatsApp.` };
  }

  const product = await getProductBySlug(data.productSlug);
  if (!product || !product.isCustomizable) return { ok: false, error: "That product can't be customized. Please pick another." };
  if (!product.colours.some((c) => c.name === data.colorName)) return { ok: false, error: "That colour isn't available for this product." };

  try {
    const res = await createCustomizationRequest({
      ...data,
      customerPhone: normaliseSriLankanMobile(data.customerPhone) ?? data.customerPhone,
      productId: product.id,
      productName: product.name,
    });
    return { ok: true, ...res };
  } catch (e) {
    log.error("custom_request_failed", e);
    return { ok: false, error: "We couldn't save your request right now. Please try again, or message us on WhatsApp." };
  }
}

/** Step 2 (after the browser uploads images): verify uploads and build the WhatsApp message. */
export async function finalizeCustomizationRequest(input: unknown): Promise<FinalizeCustomizationResult> {
  const parsed = finalizeCustomizationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { ipAddress } = await getRequestMeta();
  if (!(await checkRateLimit(RATE_LIMITS.customFinalize, ipAddress ?? "unknown")).allowed) return { ok: false, error: "Too many attempts. Please try again later." };

  const result = await verifyCustomizationUploads(parsed.data.requestId, parsed.data.idempotencyKey);
  if (!result) return { ok: false, error: "Request not found." };
  const { request, uploadedCount, failedCount } = result;

  const settings = await getPublicSettings();
  const message = buildCustomizationMessage({
    reference: request.reference,
    customerName: request.customerName,
    productName: request.productNameSnapshot,
    colorName: request.colorName,
    size: request.size,
    quantity: request.quantity,
    placements: request.placements.map((v) => PLACEMENTS.find((p) => p.value === v)?.label ?? v),
    designDescription: request.designDescription,
    additionalInstructions: request.additionalInstructions ?? undefined,
    imageCount: uploadedCount,
  });

  return { ok: true, reference: request.reference, message, whatsappUrl: buildWhatsAppUrl(message, settings.whatsappNumber), uploadedCount, failedCount };
}
