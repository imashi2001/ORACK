"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortProducts } from "../sort";
import type { CategoryRef, Product, ProductSort } from "../types";
import { ProductCard } from "./product-card";

const SORTS: { id: ProductSort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

function isSort(v: string | null): v is ProductSort {
  return SORTS.some((s) => s.id === v);
}

/** Filtering, search and sorting live in the URL so results are shareable. */
export function ProductBrowser({ products, categories }: { products: Product[]; categories: CategoryRef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawCategory = params.get("category");
  const category = categories.find((c) => c.slug === rawCategory) ?? null;
  const rawSort = params.get("sort");
  const sort: ProductSort = isSort(rawSort) ? rawSort : "featured";
  const query = params.get("q")?.trim() ?? "";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  let list = category ? products.filter((p) => p.category.slug === category.slug) : products;
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.name.toLowerCase().includes(q) || p.colours.some((c) => c.name.toLowerCase().includes(q)),
    );
  }
  list = sortProducts(list, sort);

  const tabs: { slug: string | null; name: string }[] = [{ slug: null, name: "All" }, ...categories];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <span className="eyebrow text-xs text-smoke">Shop</span>
        <h1 className="display text-[clamp(56px,8vw,120px)]">{category?.name ?? "All products"}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          {tabs.map((c) => {
            const on = (category?.slug ?? null) === c.slug;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                onClick={() => setParam("category", c.slug)}
                className={cn("h-10 border-[1.5px] border-ink px-4.5 text-xs font-semibold tracking-[0.12em] uppercase", on ? "bg-ink text-white" : "hover:bg-ink/5")}
              >
                {c.name}
              </button>
            );
          })}
          {query && (
            <button type="button" onClick={() => setParam("q", null)} className="inline-flex h-10 items-center gap-2 bg-mist px-3.5 text-sm" aria-label={`Clear search for ${query}`}>
              “{query}” <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm text-graphite">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
            className="h-10 border-[1.5px] border-input bg-white px-3 text-sm font-medium outline-none focus:border-ink"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-smoke" aria-live="polite">
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>

      {list.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-3 gap-y-8 sm:gap-x-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 bg-white p-10">
          <p className="text-lg font-semibold">No products match your search.</p>
          <button type="button" className="text-sm underline" onClick={() => router.replace(pathname)}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
