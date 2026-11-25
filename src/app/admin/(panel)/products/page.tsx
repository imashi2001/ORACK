import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { adminButton, adminInput, Badge, EmptyState, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { formatDate, PRODUCT_STATUSES, productStatusMeta } from "@/features/admin/labels";
import { listAdminProducts, listCategoryOptions } from "@/features/admin/products/queries";
import { CATALOG_ROLES, requireAdmin } from "@/features/auth/dal";
import type { ProductStatus } from "@/generated/prisma/enums";
import { formatLKR } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Manage what's for sale, prices and stock."
        actions={
          <Link href="/admin/products/new" className={adminButton()}>
            <PlusIcon /> New product
          </Link>
        }
      />
      <Suspense fallback={<PanelSkeleton />}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductsTable({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin(CATALOG_ROLES);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = PRODUCT_STATUSES.some((s) => s.value === sp.status) ? (sp.status as ProductStatus) : undefined;
  const categoryId = typeof sp.category === "string" && sp.category ? sp.category : undefined;
  const [products, categories] = await Promise.all([listAdminProducts({ q, status, categoryId }), listCategoryOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-wrap items-end gap-3 border border-line bg-white p-4" role="search">
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-[13px] font-semibold">
          Search
          <input name="q" defaultValue={q} placeholder="Name, slug or SKU" className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Status
          <select name="status" defaultValue={status ?? ""} className={adminInput}>
            <option value="">All</option>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Category
          <select name="category" defaultValue={categoryId ?? ""} className={adminInput}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButton({ variant: "secondary" })}>
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <EmptyState title="No products found">{q || status || categoryId ? "Try a different filter." : "Create your first product to start selling."}</EmptyState>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-smoke">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const s = productStatusMeta(p.status);
                return (
                  <tr key={p.id} className="hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 bg-mist">
                          {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold">{p.name}</span>
                          <span className="flex gap-1.5 text-xs text-smoke">
                            {p.isFeatured && <span>Featured</span>}
                            {p.isNewArrival && <span>New</span>}
                            {p.isCustomizable && <span>Customizable</span>}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{formatLKR(p.basePrice)}</td>
                    <td className="px-4 py-3">
                      {p.variantCount === 0 ? <Badge tone="red">No variants</Badge> : p.totalStock === 0 ? <Badge tone="red">Sold out</Badge> : `${p.totalStock} · ${p.variantCount} variants`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-smoke">{formatDate(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
