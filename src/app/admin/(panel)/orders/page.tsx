import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, adminInput, Badge, EmptyState, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { formatDateTime, ORDER_STATUSES, orderStatusMeta, PAYMENT_STATUSES, paymentStatusMeta } from "@/features/admin/labels";
import { listOrders } from "@/features/admin/orders/queries";
import { requireAdmin } from "@/features/auth/dal";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { formatLKR } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" description="Orders placed on the website. Confirm each one with the customer on WhatsApp." />
      <Suspense fallback={<PanelSkeleton />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const filters = {
    q: str("q") || undefined,
    status: ORDER_STATUSES.some((s) => s.value === str("status")) ? (str("status") as OrderStatus) : undefined,
    payment: PAYMENT_STATUSES.some((s) => s.value === str("payment")) ? (str("payment") as PaymentStatus) : undefined,
    from: DATE_RE.test(str("from")) ? str("from") : undefined,
    to: DATE_RE.test(str("to")) ? str("to") : undefined,
    page: Number(str("page")) || 1,
  };
  const { rows, total, page, pages } = await listOrders(filters);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== "page") params.set(k, String(v));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };
  const filtered = !!(filters.q || filters.status || filters.payment || filters.from || filters.to);

  return (
    <div className="flex flex-col gap-4">
      <form className="grid grid-cols-2 items-end gap-3 border border-line bg-white p-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <label className="col-span-2 flex flex-col gap-1.5 text-[13px] font-semibold md:col-span-1">
          Search
          <input name="q" defaultValue={filters.q} placeholder="Reference, name or phone" className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className={adminInput}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Payment
          <select name="payment" defaultValue={filters.payment ?? ""} className={adminInput}>
            <option value="">All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          From
          <input type="date" name="from" defaultValue={filters.from} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          To
          <input type="date" name="to" defaultValue={filters.to} className={adminInput} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className={adminButton({ variant: "secondary" })}>
            Filter
          </button>
          {filtered && (
            <Link href="/admin/orders" className={adminButton({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="text-sm text-smoke">{total === 1 ? "1 order" : `${total} orders`}</p>

      {rows.length === 0 ? (
        <EmptyState title={filtered ? "No orders match these filters" : "No orders yet"} />
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-smoke">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Reference</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Placed</th>
                <th scope="col" className="px-4 py-3 font-semibold">Items</th>
                <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => {
                const s = orderStatusMeta(o.status);
                const p = paymentStatusMeta(o.paymentStatus);
                return (
                  <tr key={o.id} className="hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium underline-offset-2 hover:underline">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-smoke">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-smoke">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.itemCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatLKR(o.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.tone}>{p.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={adminButton({ variant: "secondary", size: "sm" })}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-smoke">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className={adminButton({ variant: "secondary", size: "sm" })}>
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
