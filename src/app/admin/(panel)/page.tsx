import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, EmptyState, PageHeader, PanelSkeleton, StatCard } from "@/features/admin/components/ui";
import { getDashboardData } from "@/features/admin/dashboard-queries";
import { customizationStatusMeta, formatDateTime, orderStatusMeta, paymentStatusMeta } from "@/features/admin/labels";
import { requireAdmin } from "@/features/auth/dal";
import { formatLKR } from "@/lib/format";

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const [user, { denied }] = await Promise.all([requireAdmin(), searchParams]);
  const d = await getDashboardData();

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} description="Here's what's happening in the store." />
      {denied && <p className="border border-[#f3d9a4] bg-[#fff7e6] px-4 py-3 text-sm text-[#8a5300]">You don&apos;t have permission to open that page.</p>}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <StatCard label="Total orders" value={d.orders.total} hint={`${d.orders.cancelled} cancelled`} href="/admin/orders" />
        <StatCard label="Needs attention" value={d.orders.pending} hint="Pending or contacted" href="/admin/orders?status=PENDING" />
        <StatCard label="In progress" value={d.orders.confirmed} hint="Confirmed → dispatched" href="/admin/orders?status=CONFIRMED" />
        <StatCard label="Completed" value={d.orders.completed} hint="Delivered" href="/admin/orders?status=DELIVERED" />
        <StatCard label="Custom requests" value={d.customizations.total} hint={`${d.customizations.new} new`} href="/admin/customizations" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <StatCard label="Paid sales" value={formatLKR(d.sales.paidTotal)} hint={`${d.sales.paidCount} paid orders`} />
        <StatCard label="Awaiting payment" value={formatLKR(d.sales.openUnpaid)} hint="Open orders not yet paid" />
        <StatCard label="Last 30 days" value={formatLKR(d.sales.last30Total)} hint={`${d.sales.last30Count} orders placed (excl. cancelled)`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[13px] font-semibold underline">View all</Link>}>
          {d.recentOrders.length ? (
            <ul className="-my-2 divide-y divide-line">
              {d.recentOrders.map((o) => {
                const s = orderStatusMeta(o.status);
                const p = paymentStatusMeta(o.paymentStatus);
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-paper">
                      <span className="flex flex-col">
                        <span className="font-mono text-sm">{o.reference}</span>
                        <span className="text-[13px] text-smoke">
                          {o.customerName} · {formatDateTime(o.createdAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone={s.tone}>{s.label}</Badge>
                        <Badge tone={p.tone}>{p.label}</Badge>
                        <span className="w-24 text-right text-sm font-semibold">{formatLKR(o.total)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No orders yet">Orders placed on the website appear here.</EmptyState>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Low stock" description={`Active variants with ${d.lowStockThreshold} or fewer left`}>
            {d.lowStock.length ? (
              <ul className="-my-2 divide-y divide-line">
                {d.lowStock.map((v) => (
                  <li key={v.id}>
                    <Link href={`/admin/products/${v.product.id}`} className="flex justify-between gap-3 py-2.5 text-sm hover:bg-paper">
                      <span>
                        {v.product.name} <span className="text-smoke">· {v.colorName} / {v.size}</span>
                      </span>
                      <Badge tone={v.stockQuantity === 0 ? "red" : "amber"}>{v.stockQuantity} left</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-smoke">Everything is well stocked.</p>
            )}
          </Card>

          <Card title="Recent custom requests" actions={<Link href="/admin/customizations" className="text-[13px] font-semibold underline">View all</Link>}>
            {d.recentRequests.length ? (
              <ul className="-my-2 divide-y divide-line">
                {d.recentRequests.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/customizations/${r.id}`} className="flex justify-between gap-3 py-2.5 text-sm hover:bg-paper">
                      <span>
                        <span className="font-mono">{r.reference}</span> <span className="text-smoke">· {r.customerName}</span>
                      </span>
                      <Badge tone={customizationStatusMeta(r.status).tone}>{customizationStatusMeta(r.status).label}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-smoke">No custom requests yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
