import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { adminButton, Badge, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { productStatusMeta } from "@/features/admin/labels";
import { DeleteProduct } from "@/features/admin/products/components/delete-product";
import { ImagesManager } from "@/features/admin/products/components/images-manager";
import { ProductForm } from "@/features/admin/products/components/product-form";
import { VariantsManager } from "@/features/admin/products/components/variants-manager";
import { getAdminProduct, listCategoryOptions } from "@/features/admin/products/queries";
import { CATALOG_ROLES, requireAdmin } from "@/features/auth/dal";
import { isR2Configured } from "@/lib/r2";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  await requireAdmin(CATALOG_ROLES);
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([getAdminProduct(id), listCategoryOptions()]);
  if (!product) notFound();
  const status = productStatusMeta(product.status);

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            <Badge tone={status.tone}>{status.label}</Badge>
            {product.status === "ACTIVE" && (
              <Link href={`/products/${product.slug}`} target="_blank" className={adminButton({ variant: "secondary", size: "sm" })}>
                <ExternalLinkIcon /> View in store
              </Link>
            )}
          </>
        }
      />
      {sp.created && <p className="border border-[#bbe5c9] bg-[#ecfdf3] px-4 py-3 text-sm text-[#166534]">Product created. Now add variants and stock, then set the status to Active.</p>}
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          basePrice: product.basePrice,
          status: product.status,
          isFeatured: product.isFeatured,
          isNewArrival: product.isNewArrival,
          isCustomizable: product.isCustomizable,
          artPrint: product.artPrint,
        }}
      />
      <VariantsManager productId={product.id} basePrice={product.basePrice} variants={product.variants} />
      <ImagesManager product={product} storageReady={isR2Configured("public")} />
      <DeleteProduct productId={product.id} name={product.name} orderCount={product.orderCount} />
    </>
  );
}
