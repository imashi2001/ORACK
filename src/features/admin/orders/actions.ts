"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { authorizeAction } from "@/features/auth/dal";
import { CATALOG_TAG } from "@/features/products/queries";
import { getPrisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", "DISPATCHED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(500).optional(),
  restock: z.boolean().optional(),
});

/**
 * Changes an order's status and records it in the history.
 * Cancelling returns the items to stock (unless told not to). A cancelled order is final.
 */
export async function updateOrderStatus(orderId: string, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  const { status, note, restock = true } = parsed.data;

  const result = await getPrisma().$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { ok: false as const, error: "Order not found." };
    if (order.status === status) return { ok: false as const, error: "The order already has that status." };
    if (order.status === "CANCELLED") return { ok: false as const, error: "Cancelled orders can't be reopened. Ask the customer to place a new order." };

    // Guard against two admins changing the same order at once.
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status,
        ...(status === "CONFIRMED" && !order.confirmedAt ? { confirmedAt: new Date() } : {}),
        ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });
    if (updated.count !== 1) return { ok: false as const, error: "Someone else just changed this order. Reload and try again." };

    let restocked = 0;
    if (status === "CANCELLED" && restock) {
      for (const item of order.items) {
        if (!item.variantId) continue; // variant was deleted
        const r = await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
        restocked += r.count ? item.quantity : 0;
      }
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: status,
        note: [note, status === "CANCELLED" ? (restock ? `${restocked} item(s) returned to stock` : "Stock not returned") : null].filter(Boolean).join(" · ") || null,
        changedById: auth.user.id,
      },
    });
    await logActivity({ userId: auth.user.id, action: "order.status", entityType: "Order", entityId: orderId, metadata: { from: order.status, to: status } }, tx);
    return { ok: true as const, restocked };
  });

  if (result.ok && result.restocked > 0) updateTag(CATALOG_TAG);
  return result.ok ? { ok: true } : result;
}

const paymentSchema = z.object({
  paymentStatus: z.enum(["UNPAID", "PAYMENT_PENDING", "PAID", "REFUNDED"]),
  note: z.string().trim().max(500).optional(),
});

/** Payment is only ever marked by an admin, never automatically. */
export async function updatePaymentStatus(orderId: string, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment status." };
  const { paymentStatus, note } = parsed.data;

  return getPrisma().$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
    if (!order) return { ok: false, error: "Order not found." };
    if (order.paymentStatus === paymentStatus) return { ok: false, error: "The order already has that payment status." };
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus } });
    await tx.orderStatusHistory.create({ data: { orderId, fromPaymentStatus: order.paymentStatus, toPaymentStatus: paymentStatus, note: note || null, changedById: auth.user.id } });
    await logActivity({ userId: auth.user.id, action: "order.payment", entityType: "Order", entityId: orderId, metadata: { from: order.paymentStatus, to: paymentStatus } }, tx);
    return { ok: true };
  });
}

/** Sets the delivery fee agreed with the customer and recalculates the total. */
export async function updateDeliveryFee(orderId: string, fee: number): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = z.number().min(0).max(100_000).multipleOf(0.01).safeParse(fee);
  if (!parsed.success) return { ok: false, error: "Enter a valid delivery fee." };

  return getPrisma().$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { subtotal: true, deliveryFee: true } });
    if (!order) return { ok: false, error: "Order not found." };
    const total = order.subtotal.toNumber() + parsed.data;
    await tx.order.update({ where: { id: orderId }, data: { deliveryFee: parsed.data, total } });
    await tx.orderStatusHistory.create({ data: { orderId, note: `Delivery fee set to Rs. ${parsed.data.toLocaleString("en-US")}`, changedById: auth.user.id } });
    await logActivity({ userId: auth.user.id, action: "order.deliveryFee", entityType: "Order", entityId: orderId, metadata: { from: order.deliveryFee.toNumber(), to: parsed.data } }, tx);
    return { ok: true };
  });
}

export async function updateAdminNotes(orderId: string, notes: string): Promise<ActionResult> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const parsed = z.string().trim().max(4000).safeParse(notes);
  if (!parsed.success) return { ok: false, error: "Notes are too long." };
  await getPrisma().order.update({ where: { id: orderId }, data: { adminNotes: parsed.data || null } });
  await logActivity({ userId: auth.user.id, action: "order.notes", entityType: "Order", entityId: orderId });
  return { ok: true };
}
