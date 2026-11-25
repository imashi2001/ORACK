"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminButton, Card, FormError } from "@/features/admin/components/ui";
import { deleteProduct } from "../actions";

export function DeleteProduct({ productId, name, orderCount }: { productId: string; name: string; orderCount: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card title="Delete product">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm text-smoke">
          {orderCount > 0
            ? `This product appears in ${orderCount} order line(s). Those orders keep their details, but consider setting the status to Inactive instead.`
            : "Permanently removes the product, its variants and photos."}
        </p>
        <button
          type="button"
          disabled={pending}
          className={adminButton({ variant: "danger" })}
          onClick={() => {
            if (!confirm(`Delete "${name}" permanently?`)) return;
            startTransition(async () => {
              const res = await deleteProduct(productId);
              if (!res.ok) return setError(res.error);
              router.push("/admin/products");
            });
          }}
        >
          {pending ? "Deleting…" : "Delete product"}
        </button>
      </div>
      <FormError message={error} />
    </Card>
  );
}
