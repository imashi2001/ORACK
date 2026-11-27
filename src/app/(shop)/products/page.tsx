import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/shop/container";
import { ProductBrowser } from "@/features/products/components/product-browser";
import { getCategories, getProducts } from "@/features/products/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/products" },
  title: "Shop",
  description: "Oversized ORACK streetwear in black, white and grey. Order in minutes on WhatsApp.",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <Container className="py-12 lg:py-16">
      {/* ProductBrowser reads the URL's search params, so it streams in behind the static shell. */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductBrowser products={products} categories={categories} />
      </Suspense>
    </Container>
  );
}

function ProductsSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="h-28 w-2/3 bg-mist" />
      <div className="h-18 border-y border-line" />
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-3 gap-y-8 sm:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[4/5] bg-mist" />
        ))}
      </div>
    </div>
  );
}
