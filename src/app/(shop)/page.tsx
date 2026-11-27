import type { Metadata } from "next";
import { Container } from "@/components/shop/container";
import { CategoryTiles } from "@/features/home/components/category-tiles";
import { CustomizeBand } from "@/features/home/components/customize-band";
import { Hero } from "@/features/home/components/hero";
import { getHeroSlides } from "@/features/hero/queries";
import { HowOrdering, Story, ValueProps } from "@/features/home/components/info-sections";
import { Lookbook } from "@/features/home/components/lookbook";
import { Reveal } from "@/components/shop/reveal";
import { SectionHeading } from "@/components/shop/street";
import { Marquee } from "@/features/home/components/marquee";
import { FeaturedCollection } from "@/features/products/components/featured-collection";
import { ProductCard } from "@/features/products/components/product-card";
import { getCategories, getFeaturedProducts, getNewArrivals, getProducts } from "@/features/products/queries";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

/** The one true address of each page, so copies (e.g. the vercel.app URL) aren't indexed separately. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [featured, newArrivals, all, categories, heroSlides] = await Promise.all([getFeaturedProducts(), getNewArrivals(), getProducts(), getCategories(), getHeroSlides()]);

  return (
    <>
      <Hero slides={heroSlides} />
      <Marquee />
      <CategoryTiles />

      <section aria-labelledby="featured-heading" className="overflow-hidden bg-paper py-[clamp(64px,8vw,112px)]">
        <Container>
          <FeaturedCollection featured={featured} pool={all} categories={categories} />
        </Container>
      </section>

      <CustomizeBand />

      <Lookbook products={[...featured, ...newArrivals.filter((n) => !featured.some((f) => f.id === n.id))]} />

      <section aria-labelledby="new-heading" className="overflow-hidden bg-white py-[clamp(64px,8vw,112px)]">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading id="new-heading" index="[04]" eyebrow="Just landed" title="New arrivals" ghost="NEW IN" note="just dropped" />
            <Link href="/products?sort=newest" className="inline-flex items-center gap-2 border-b-[1.5px] border-current pb-0.5 text-sm font-semibold hover:opacity-70">
              Shop new in <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          <div className="grid snap-x snap-mandatory auto-cols-[minmax(260px,1fr)] grid-flow-col gap-6 overflow-x-auto pb-3 [&>*]:snap-start">
            {newArrivals.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} surface="white" />
              </Reveal>
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
