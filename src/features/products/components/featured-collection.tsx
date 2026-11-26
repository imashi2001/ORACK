"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Reveal } from "@/components/shop/reveal";
import { SectionHeading } from "@/components/shop/street";
import { cn } from "@/lib/utils";
import type { CategoryRef, Product } from "../types";
import { ProductCard } from "./product-card";

/** Featured grid with category tabs. `pool` supplies extra products when a tab has few featured items. */
export function FeaturedCollection({ featured, pool, categories }: { featured: Product[]; pool: Product[]; categories: CategoryRef[] }) {
  const [tab, setTab] = useState<string | null>(null);
  const tabs = [{ slug: null as string | null, name: "All" }, ...categories.filter((c) => pool.some((p) => p.category.slug === c.slug))];
  const items = !tab
    ? featured.length
      ? featured
      : pool.slice(0, 4)
    : [...featured.filter((p) => p.category.slug === tab), ...pool.filter((p) => p.category.slug === tab && !p.isFeatured)].slice(0, 4);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading id="featured-heading" index="[01]" eyebrow="Drop 01 — Essentials" title="Featured collection" ghost="DROP 01" />
        <div className="flex flex-wrap items-center gap-6">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.name}
                type="button"
                aria-pressed={tab === t.slug}
                onClick={() => setTab(t.slug)}
                className={cn(
                  "h-10 border-[1.5px] border-ink px-4.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                  tab === t.slug ? "bg-ink text-white" : "hover:bg-ink/5",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 border-b-[1.5px] border-current pb-0.5 text-sm font-semibold hover:opacity-70">
            View all products <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
      {items.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-x-6 gap-y-7">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <ProductCard product={p} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="bg-white p-10 text-graphite">New products are on the way.</p>
      )}
    </div>
  );
}
