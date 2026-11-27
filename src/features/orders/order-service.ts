import "server-only";
import { discountedPrice } from "@/features/products/pricing";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { generateReference } from "@/lib/reference";
import type { PlaceOrderInput } from "./schemas";
import type { PricedLine, StockIssue } from "./types";

export class InsufficientStockError extends Error {
  constructor(public issue: StockIssue) {
    super(`Insufficient stock for ${issue.productName}`);
  }
}

type CreateOrderResult =
  | { ok: true; order: { reference: string; total: number; lines: PricedLine[]; deliveryAddress: string; customerName: string; customerPhone: string; customerNote: string | null } }
  | { ok: false; error: string; stockIssues?: StockIssue[] };

const orderInclude = { items: true } satisfies Prisma.OrderInclude;
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toResult(order: OrderWithItems): CreateOrderResult {
  return {
    ok: true,
    order: {
      reference: order.reference,
      total: order.total.toNumber(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      customerNote: order.customerNote,
      lines: order.items.map((i) => ({
        variantId: i.variantId ?? "",
        productId: i.productId ?? "",
        productName: i.productName,
        sku: i.sku ?? "",
        size: i.size,
        colorName: i.colorName,
        unitPrice: i.unitPrice.toNumber(),
        quantity: i.quantity,
        lineTotal: i.lineTotal.toNumber(),
      })),
    },
  };
}

function isUniqueViolation(e: unknown, field: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  const target = JSON.stringify(e.meta ?? {});
  return target.includes(field);
}

/**
 * Creates an order from trusted database data.
 *  - Prices come from the database, never from the browser.
 *  - Stock is decremented with a conditional UPDATE inside one transaction, so two customers
 *    can't buy the last item; any shortfall rolls the whole order back.
 *  - The idempotency key makes a double submit return the first order instead of creating two.
 *  - The order starts PENDING / UNPAID: opening WhatsApp doesn't confirm or pay anything.
 */
export async function createOrder(input: PlaceOrderInput & { customerPhone: string }): Promise<CreateOrderResult> {
  const prisma = getPrisma();

  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
  if (existing) return toResult(existing);

  // Merge duplicate lines so the stock check sees the real quantity.
  const merged = new Map<string, number>();
  for (const i of input.items) merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.quantity);

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: { product: { select: { id: true, name: true, basePrice: true, discountPercent: true, status: true, category: { select: { isActive: true } } } } },
  });

  const lines: PricedLine[] = [];
  const stockIssues: StockIssue[] = [];
  for (const [variantId, quantity] of merged) {
    const v = variants.find((x) => x.id === variantId);
    // Hidden categories (e.g. a paused line) can't be ordered either, even from an old bag.
    if (!v || !v.isActive || v.product.status !== "ACTIVE" || !v.product.category.isActive) {
      return { ok: false, error: "One of the items in your bag is no longer available. Please remove it and try again." };
    }
    if (v.stockQuantity < quantity) {
      stockIssues.push({ variantId, productName: `${v.product.name} (${v.colorName} / ${v.size})`, requested: quantity, available: v.stockQuantity });
      continue;
    }
    const unitPrice = discountedPrice((v.price ?? v.product.basePrice).toNumber(), v.product.discountPercent);
    lines.push({
      variantId,
      productId: v.product.id,
      productName: v.product.name,
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    });
  }
  if (stockIssues.length) return { ok: false, error: "Some items don't have enough stock.", stockIssues };

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        for (const l of lines) {
          const updated = await tx.productVariant.updateMany({
            where: { id: l.variantId, isActive: true, stockQuantity: { gte: l.quantity } },
            data: { stockQuantity: { decrement: l.quantity } },
          });
          if (updated.count !== 1) {
            const fresh = await tx.productVariant.findUnique({ where: { id: l.variantId }, select: { stockQuantity: true } });
            throw new InsufficientStockError({
              variantId: l.variantId,
              productName: `${l.productName} (${l.colorName} / ${l.size})`,
              requested: l.quantity,
              available: fresh?.stockQuantity ?? 0,
            });
          }
        }
        return tx.order.create({
          data: {
            reference: generateReference("ORK"),
            idempotencyKey: input.idempotencyKey,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            deliveryAddress: input.deliveryAddress,
            customerNote: input.customerNote || null,
            subtotal,
            deliveryFee: 0,
            total: subtotal,
            items: {
              create: lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                productName: l.productName,
                sku: l.sku,
                size: l.size,
                colorName: l.colorName,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
                lineTotal: l.lineTotal,
              })),
            },
            statusHistory: { create: { toStatus: "PENDING", toPaymentStatus: "UNPAID", note: "Order placed on the website" } },
          },
          include: orderInclude,
        });
      });
      return toResult(order);
    } catch (e) {
      if (e instanceof InsufficientStockError) return { ok: false, error: "Some items just sold out.", stockIssues: [e.issue] };
      if (isUniqueViolation(e, "idempotencyKey")) {
        const first = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
        if (first) return toResult(first);
      }
      if (isUniqueViolation(e, "reference")) continue; // extremely rare; retry with a new reference
      throw e;
    }
  }
  return { ok: false, error: "We couldn't place your order. Please try again." };
}
