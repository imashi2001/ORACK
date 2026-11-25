"use server";

import { z } from "zod";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction } from "@/features/auth/dal";
import type { CustomizationStatus } from "@/generated/prisma/enums";
import { getPrisma } from "@/lib/prisma";
import { generateReference } from "@/lib/reference";

/**
 * Workflow: NEW_REQUEST → UNDER_REVIEW → QUOTATION_PREPARED → AWAITING_CUSTOMER_CONFIRMATION
 * → ACCEPTED / REJECTED → CONVERTED_TO_ORDER → COMPLETED.
 * CONVERTED_TO_ORDER is only set by convertToOrder(); the request record is never deleted or overwritten.
 */
const MANUAL_STATUSES = ["NEW_REQUEST", "UNDER_REVIEW", "QUOTATION_PREPARED", "AWAITING_CUSTOMER_CONFIRMATION", "ACCEPTED", "REJECTED", "COMPLETED"] as const;
const CLOSED: CustomizationStatus[] = ["CONVERTED_TO_ORDER", "COMPLETED"];

const money = z.number().min(0).max(10_000_000).multipleOf(0.01, "Use at most 2 decimals");

export async function updateCustomizationStatus(requestId: string, status: unknown): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = z.enum(MANUAL_STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "That status is set automatically." };
  const prisma = getPrisma();
  const req = await prisma.customizationRequest.findUnique({ where: { id: requestId }, select: { status: true } });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status === "CONVERTED_TO_ORDER" && parsed.data !== "COMPLETED") return { ok: false, error: "This request is already an order. It can only be marked Completed." };
  if (req.status === parsed.data) return { ok: false, error: "The request already has that status." };

  const updated = await prisma.customizationRequest.updateMany({ where: { id: requestId, status: req.status }, data: { status: parsed.data } });
  if (updated.count !== 1) return { ok: false, error: "Someone else just changed this request. Reload and try again." };
  await logActivity({ userId: auth.user.id, action: "customization.status", entityType: "CustomizationRequest", entityId: requestId, metadata: { from: req.status, to: parsed.data } });
  return { ok: true };
}

export async function updateCustomizationNotes(requestId: string, notes: string): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = z.string().trim().max(4000).safeParse(notes);
  if (!parsed.success) return { ok: false, error: "Notes are too long." };
  await getPrisma().customizationRequest.update({ where: { id: requestId }, data: { adminNotes: parsed.data || null } });
  await logActivity({ userId: auth.user.id, action: "customization.notes", entityType: "CustomizationRequest", entityId: requestId });
  return { ok: true };
}

const quotationSchema = z.object({
  unitPrice: money.positive("Enter a unit price"),
  quantity: z.number().int().min(1).max(10_000),
  setupFee: money,
  deliveryFee: money,
  validUntil: z.iso.date().nullable(),
  notes: z.string().trim().max(1000).optional(),
});

/** Creates a new quotation version (DRAFT). The total is always calculated on the server. */
export async function createQuotation(requestId: string, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = quotationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the quotation.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const q = parsed.data;
  const total = Math.round((q.unitPrice * q.quantity + q.setupFee + q.deliveryFee) * 100) / 100;

  return getPrisma().$transaction(async (tx) => {
    const req = await tx.customizationRequest.findUnique({ where: { id: requestId }, select: { status: true } });
    if (!req) return { ok: false, error: "Request not found." };
    if (CLOSED.includes(req.status)) return { ok: false, error: "This request is closed." };
    const last = await tx.customizationQuotation.findFirst({ where: { requestId }, orderBy: { version: "desc" }, select: { version: true } });
    const version = (last?.version ?? 0) + 1;
    await tx.customizationQuotation.create({
      data: {
        requestId,
        version,
        unitPrice: q.unitPrice,
        quantity: q.quantity,
        setupFee: q.setupFee,
        deliveryFee: q.deliveryFee,
        total,
        validUntil: q.validUntil ? new Date(`${q.validUntil}T23:59:59+05:30`) : null,
        notes: q.notes || null,
        createdById: auth.user.id,
      },
    });
    if (["NEW_REQUEST", "UNDER_REVIEW", "REJECTED"].includes(req.status)) {
      await tx.customizationRequest.update({ where: { id: requestId }, data: { status: "QUOTATION_PREPARED" } });
    }
    await logActivity({ userId: auth.user.id, action: "quotation.create", entityType: "CustomizationRequest", entityId: requestId, metadata: { version, total } }, tx);
    return { ok: true };
  });
}

/**
 * Records that the admin sent this quotation on WhatsApp (we can't detect it automatically).
 * Older open quotations are marked superseded.
 */
export async function markQuotationSent(requestId: string, quotationId: string): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  return getPrisma().$transaction(async (tx) => {
    const quote = await tx.customizationQuotation.findFirst({ where: { id: quotationId, requestId }, include: { request: { select: { status: true } } } });
    if (!quote) return { ok: false, error: "Quotation not found." };
    if (quote.status !== "DRAFT") return { ok: false, error: "Only draft quotations can be marked as sent." };
    if (CLOSED.includes(quote.request.status)) return { ok: false, error: "This request is closed." };
    const newer = await tx.customizationQuotation.count({ where: { requestId, version: { gt: quote.version }, status: { not: "EXPIRED" } } });
    if (newer > 0) return { ok: false, error: "A newer version of this quotation exists. Send that one instead." };
    // Only older versions are superseded by this one.
    await tx.customizationQuotation.updateMany({ where: { requestId, version: { lt: quote.version }, status: { in: ["DRAFT", "SENT"] } }, data: { status: "EXPIRED" } });
    await tx.customizationQuotation.update({ where: { id: quotationId }, data: { status: "SENT", sentAt: new Date() } });
    await tx.customizationRequest.update({ where: { id: requestId }, data: { status: "AWAITING_CUSTOMER_CONFIRMATION" } });
    await logActivity({ userId: auth.user.id, action: "quotation.sent", entityType: "CustomizationRequest", entityId: requestId, metadata: { version: quote.version } }, tx);
    return { ok: true };
  });
}

/** Records the customer's answer from the WhatsApp chat. */
export async function recordQuotationDecision(requestId: string, quotationId: string, decision: unknown): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = z.enum(["ACCEPTED", "REJECTED"]).safeParse(decision);
  if (!parsed.success) return { ok: false, error: "Invalid decision." };
  return getPrisma().$transaction(async (tx) => {
    const quote = await tx.customizationQuotation.findFirst({ where: { id: quotationId, requestId }, include: { request: { select: { status: true } } } });
    if (!quote) return { ok: false, error: "Quotation not found." };
    if (quote.status !== "SENT") return { ok: false, error: "Mark the quotation as sent first." };
    if (CLOSED.includes(quote.request.status)) return { ok: false, error: "This request is closed." };
    await tx.customizationQuotation.update({ where: { id: quotationId }, data: { status: parsed.data } });
    // A rejected quote sends the request back to review so a revised quote can be prepared.
    await tx.customizationRequest.update({ where: { id: requestId }, data: { status: parsed.data === "ACCEPTED" ? "ACCEPTED" : "UNDER_REVIEW" } });
    await logActivity({ userId: auth.user.id, action: `quotation.${parsed.data.toLowerCase()}`, entityType: "CustomizationRequest", entityId: requestId, metadata: { version: quote.version } }, tx);
    return { ok: true };
  });
}

const convertSchema = z.object({
  deliveryAddress: z.string().trim().min(10, "Enter the full delivery address").max(300),
  note: z.string().trim().max(300).optional(),
});

/**
 * Creates a CONFIRMED order from the accepted quotation. The request is kept and linked
 * to the order (Order.sourceCustomizationRequestId), and can't be converted twice.
 * Stock is not changed: custom prints are made to order.
 */
export async function convertToOrder(requestId: string, input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = convertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details.", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  return getPrisma().$transaction(async (tx) => {
    const req = await tx.customizationRequest.findUnique({
      where: { id: requestId },
      include: { quotations: { where: { status: "ACCEPTED" }, orderBy: { version: "desc" }, take: 1 }, order: { select: { id: true } } },
    });
    if (!req) return { ok: false as const, error: "Request not found." };
    if (req.order) return { ok: false as const, error: "This request has already been converted." };
    if (req.status !== "ACCEPTED") return { ok: false as const, error: "Only accepted requests can be converted." };
    const quote = req.quotations[0];
    if (!quote) return { ok: false as const, error: "Record the customer's acceptance of a quotation first." };

    const unitPrice = quote.unitPrice.toNumber();
    const setupFee = quote.setupFee.toNumber();
    const lineTotal = unitPrice * quote.quantity;
    const items = [
      { productId: req.productId, productName: `Custom — ${req.productNameSnapshot}`, size: req.size, colorName: req.colorName, unitPrice, quantity: quote.quantity, lineTotal },
      ...(setupFee > 0 ? [{ productId: null, productName: "Setup / print fee", size: "—", colorName: "—", unitPrice: setupFee, quantity: 1, lineTotal: setupFee }] : []),
    ];

    const order = await tx.order.create({
      data: {
        reference: generateReference("ORK"),
        idempotencyKey: `customization:${req.id}`,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        deliveryAddress: parsed.data.deliveryAddress,
        customerNote: parsed.data.note || null,
        subtotal: lineTotal + setupFee,
        deliveryFee: quote.deliveryFee,
        total: quote.total,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        confirmedAt: new Date(),
        sourceCustomizationRequestId: req.id,
        items: { create: items },
        statusHistory: {
          create: { toStatus: "CONFIRMED", toPaymentStatus: "UNPAID", note: `Created from custom request ${req.reference} (quotation v${quote.version})`, changedById: auth.user.id },
        },
      },
    });
    await tx.customizationRequest.update({ where: { id: req.id }, data: { status: "CONVERTED_TO_ORDER" } });
    await logActivity({ userId: auth.user.id, action: "customization.convert", entityType: "CustomizationRequest", entityId: req.id, metadata: { orderId: order.id, reference: order.reference } }, tx);
    return { ok: true as const, data: { orderId: order.id } };
  });
}
