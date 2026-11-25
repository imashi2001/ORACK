import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/shop/container";
import { ProductBrowser } from "@/features/products/components/product-browser";
import { getCategories, getProducts } from "@/features/products/queries";

export const metadata: Metadata = {
  title: "Shop",
  description: "Oversized T-shirts and hoodies in black, white, ash and charcoal.",
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[4/5] bg-mist" />
        ))}
      </div>
    </div>
  );
}
