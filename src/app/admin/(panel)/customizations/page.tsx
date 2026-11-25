import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, adminInput, Badge, EmptyState, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { listCustomizations } from "@/features/admin/customizations/queries";
import { CUSTOMIZATION_STATUSES, customizationStatusMeta, formatDateTime } from "@/features/admin/labels";
import { requireAdmin } from "@/features/auth/dal";
import type { CustomizationStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Custom requests" };

export default function CustomizationsPage({ searchParams }: PageProps<"/admin/customizations">) {
  return (
    <>
      <PageHeader title="Custom requests" description="Quote requests for custom prints. They become orders only after the customer accepts a quotation." />
      <Suspense fallback={<PanelSkeleton />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Requests({ searchParams }: Pick<PageProps<"/admin/customizations">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const filters = {
    q: str("q") || undefined,
    status: CUSTOMIZATION_STATUSES.some((s) => s.value === str("status")) ? (str("status") as CustomizationStatus) : undefined,
    page: Number(str("page")) || 1,
  };
  const { rows, total, page, pages } = await listCustomizations(filters);
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/customizations?${qs}` : "/admin/customizations";
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-wrap items-end gap-3 border border-line bg-white p-4" role="search">
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-[13px] font-semibold">
          Search
          <input name="q" defaultValue={filters.q} placeholder="Reference, name, phone or product" className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className={adminInput}>
            <option value="">All</option>
            {CUSTOMIZATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButton({ variant: "secondary" })}>
          Filter
        </button>
      </form>

      <p className="text-sm text-smoke">{total === 1 ? "1 request" : `${total} requests`}</p>

      {rows.length === 0 ? (
        <EmptyState title={filters.q || filters.status ? "No requests match these filters" : "No custom requests yet"} />
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-smoke">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Reference</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Images</th>
                <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const s = customizationStatusMeta(r.status);
                return (
                  <tr key={r.id} className="hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customizations/${r.id}`} className="font-mono font-medium underline-offset-2 hover:underline">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-xs text-smoke">{r.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.productNameSnapshot} <span className="text-smoke">× {r.quantity}</span>
                    </td>
                    <td className="px-4 py-3">{r.imageCount}</td>
                    <td className="px-4 py-3 text-smoke">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
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
          {page > 1 ? <Link href={pageHref(page - 1)} className={adminButton({ variant: "secondary", size: "sm" })}>← Newer</Link> : <span />}
          <span className="text-sm text-smoke">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)} className={adminButton({ variant: "secondary", size: "sm" })}>Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
