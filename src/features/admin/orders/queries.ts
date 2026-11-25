import "server-only";
import type { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export const ORDERS_PAGE_SIZE = 20;

export interface OrderFilters {
  q?: string;
  status?: OrderStatus;
  payment?: PaymentStatus;
  from?: string;
  to?: string;
  page?: number;
}

/** Dates are YYYY-MM-DD in Sri Lanka time (UTC+05:30). */
function colomboDayStart(day: string): Date {
  return new Date(`${day}T00:00:00+05:30`);
}

export async function listOrders(f: OrderFilters) {
  const createdAt: Prisma.DateTimeFilter = {};
  if (f.from) createdAt.gte = colomboDayStart(f.from);
  if (f.to) createdAt.lt = new Date(colomboDayStart(f.to).getTime() + 24 * 60 * 60 * 1000);
  const digits = f.q?.replace(/\D/g, "") ?? "";

  const where: Prisma.OrderWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.payment ? { paymentStatus: f.payment } : {}),
    ...(f.from || f.to ? { createdAt } : {}),
    ...(f.q
      ? {
          OR: [
            { reference: { contains: f.q.trim(), mode: "insensitive" } },
            { customerName: { contains: f.q.trim(), mode: "insensitive" } },
            ...(digits.length >= 4 ? [{ customerPhone: { contains: digits.replace(/^94/, "0") } }] : []),
          ],
        }
      : {}),
  };
  const page = Math.max(1, f.page ?? 1);
  const prisma = getPrisma();
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: { id: true, reference: true, customerName: true, customerPhone: true, total: true, status: true, paymentStatus: true, createdAt: true, _count: { select: { items: true } } },
    }),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
    rows: rows.map((r) => ({ ...r, total: r.total.toNumber(), itemCount: r._count.items })),
  };
}

export async function getOrderDetail(id: string) {
  const o = await getPrisma().order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { productName: "asc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
    },
  });
  if (!o) return null;
  return {
    ...o,
    subtotal: o.subtotal.toNumber(),
    deliveryFee: o.deliveryFee.toNumber(),
    total: o.total.toNumber(),
    items: o.items.map((i) => ({ ...i, unitPrice: i.unitPrice.toNumber(), lineTotal: i.lineTotal.toNumber() })),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
