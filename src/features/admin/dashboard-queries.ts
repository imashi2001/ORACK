import "server-only";
import { getPrisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 2;

export async function getDashboardData() {
  const prisma = getPrisma();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byStatus, customizationCount, newCustomizations, paid, open, last30, recentOrders, recentRequests, lowStock] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customizationRequest.count(),
    prisma.customizationRequest.count({ where: { status: "NEW_REQUEST" } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID", status: { not: "CANCELLED" } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: { notIn: ["CANCELLED", "DELIVERED"] }, paymentStatus: { not: "PAID" } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since30 }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, reference: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true } }),
    prisma.customizationRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, customerName: true, productNameSnapshot: true, status: true, createdAt: true } }),
    prisma.productVariant.findMany({
      where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD }, product: { status: "ACTIVE" } },
      orderBy: { stockQuantity: "asc" },
      take: 8,
      select: { id: true, size: true, colorName: true, stockQuantity: true, product: { select: { id: true, name: true } } },
    }),
  ]);

  const count = (statuses: string[]) => byStatus.filter((s) => statuses.includes(s.status)).reduce((n, s) => n + s._count._all, 0);

  return {
    orders: {
      total: count(["PENDING", "CONTACTED", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", "DISPATCHED", "DELIVERED", "CANCELLED"]),
      pending: count(["PENDING", "CONTACTED"]),
      confirmed: count(["CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", "DISPATCHED"]),
      completed: count(["DELIVERED"]),
      cancelled: count(["CANCELLED"]),
    },
    customizations: { total: customizationCount, new: newCustomizations },
    sales: {
      paidTotal: paid._sum.total?.toNumber() ?? 0,
      paidCount: paid._count._all,
      openUnpaid: open._sum.total?.toNumber() ?? 0,
      last30Total: last30._sum.total?.toNumber() ?? 0,
      last30Count: last30._count._all,
    },
    recentOrders: recentOrders.map((o) => ({ ...o, total: o.total.toNumber() })),
    recentRequests,
    lowStock,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}
