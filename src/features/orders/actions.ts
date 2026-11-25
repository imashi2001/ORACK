"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/products/queries";
import { getPublicSettings } from "@/features/settings/queries";
import { normaliseSriLankanMobile } from "@/lib/format";
import { log } from "@/lib/log";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { createOrder } from "./order-service";
import { placeOrderSchema } from "./schemas";
import type { PlaceOrderResult } from "./types";

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const { ipAddress } = await getRequestMeta();
  const limit = await checkRateLimit(RATE_LIMITS.placeOrder, ipAddress ?? "unknown");
  if (!limit.allowed) {
    log.warn("rate_limited", { action: "placeOrder" });
    return { ok: false, error: `Too many orders from this connection. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes, or message us on WhatsApp.` };
  }

  const customerPhone = normaliseSriLankanMobile(data.customerPhone) ?? data.customerPhone;

  let result;
  try {
    result = await createOrder({ ...data, customerPhone });
  } catch (e) {
    log.error("place_order_failed", e);
    return { ok: false, error: "We couldn't place your order right now. Please try again, or message us on WhatsApp." };
  }
  if (!result.ok) return result;

  // Stock changed, so the storefront's cached catalogue must refresh.
  updateTag(CATALOG_TAG);

  const { order } = result;
  const settings = await getPublicSettings();
  const message = buildOrderMessage({
    reference: order.reference,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    items: order.lines,
    total: order.total,
    note: order.customerNote,
  });

  return {
    ok: true,
    reference: order.reference,
    lines: order.lines,
    total: order.total,
    message,
    whatsappUrl: buildWhatsAppUrl(message, settings.whatsappNumber),
    persisted: true,
  };
}
