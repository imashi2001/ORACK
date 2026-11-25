import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { ProductForm } from "@/features/admin/products/components/product-form";
import { listCategoryOptions } from "@/features/admin/products/queries";
import { CATALOG_ROLES, requireAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} description="Save the details first, then add variants, stock and photos." />
      <Suspense fallback={<PanelSkeleton />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await requireAdmin(CATALOG_ROLES);
  const categories = await listCategoryOptions();
  if (!categories.length) {
    return (
      <EmptyState title="Create a category first">
        <Link href="/admin/categories" className="underline">
          Go to Categories
        </Link>
      </EmptyState>
    );
  }
  return <ProductForm categories={categories} />;
}
