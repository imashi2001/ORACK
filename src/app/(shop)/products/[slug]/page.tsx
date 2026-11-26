import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/shop/container";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductDetail } from "@/features/products/components/product-detail";
import { getAllProductSlugs, getProductBySlug, getProducts } from "@/features/products/queries";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  // Cache Components needs at least one param at build time. With an empty catalogue,
  // prerender a placeholder that resolves to the 404 page; real slugs render on request.
  return (slugs.length ? slugs : ["coming-soon"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Container className="flex flex-col gap-8 pt-7 pb-24">
      <Suspense fallback={<div className="aspect-[16/9] bg-mist" aria-hidden="true" />}>
        <ProductContent params={params} />
      </Suspense>
    </Container>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProducts()).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="eyebrow flex flex-wrap gap-2.5 text-smoke">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink" aria-current="page">
          {product.name}
        </span>
      </nav>

      <ProductDetail product={product} />

      <section aria-labelledby="related-heading" className="mt-16 flex flex-col gap-8">
        <h2 id="related-heading" className="display text-[clamp(40px,5vw,64px)]">
          Complete the look
        </h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-6">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
