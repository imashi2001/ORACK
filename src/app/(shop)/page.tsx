import { Container } from "@/components/shop/container";
import { CategoryTiles } from "@/features/home/components/category-tiles";
import { CustomizeBand } from "@/features/home/components/customize-band";
import { Hero } from "@/features/home/components/hero";
import { HowOrdering, Story, ValueProps } from "@/features/home/components/info-sections";
import { Marquee } from "@/features/home/components/marquee";
import { FeaturedCollection } from "@/features/products/components/featured-collection";
import { ProductCard } from "@/features/products/components/product-card";
import { getCategories, getFeaturedProducts, getNewArrivals, getProducts } from "@/features/products/queries";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

export default async function HomePage() {
  const [featured, newArrivals, all, categories] = await Promise.all([getFeaturedProducts(), getNewArrivals(), getProducts(), getCategories()]);

  return (
    <>
      <Hero />
      <Marquee />
      <CategoryTiles />

      <section aria-labelledby="featured-heading" className="bg-paper py-[clamp(64px,8vw,112px)]">
        <Container>
          <FeaturedCollection featured={featured} pool={all} categories={categories} />
        </Container>
      </section>

      <CustomizeBand />

      <section aria-labelledby="new-heading" className="bg-white py-[clamp(64px,8vw,112px)]">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3.5">
              <span className="eyebrow text-xs text-smoke">Just landed</span>
              <h2 id="new-heading" className="display text-[clamp(48px,6vw,84px)]">
                New arrivals
              </h2>
            </div>
            <Link href="/products?sort=newest" className="inline-flex items-center gap-2 border-b-[1.5px] border-current pb-0.5 text-sm font-semibold hover:opacity-70">
              Shop new in <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          <div className="grid snap-x snap-mandatory auto-cols-[minmax(260px,1fr)] grid-flow-col gap-6 overflow-x-auto pb-3 [&>*]:snap-start">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} surface="white" />
            ))}
          </div>
        </Container>
      </section>

      <HowOrdering />
      <ValueProps />
      <Story />
    </>
  );
}
