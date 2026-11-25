import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/features/admin/categories/category-manager";
import { PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { CATALOG_ROLES, requireAdmin } from "@/features/auth/dal";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" description="Group products in the store's navigation and filters." />
      <Suspense fallback={<PanelSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  await requireAdmin(CATALOG_ROLES);
  const rows = await getPrisma().category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <CategoryManager
      categories={rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder, isActive: c.isActive, productCount: c._count.products }))}
    />
  );
}
