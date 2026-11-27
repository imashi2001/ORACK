"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminButton, adminInput, adminLabel, adminTextarea, Card, FormError } from "@/features/admin/components/ui";
import { PRODUCT_STATUSES } from "@/features/admin/labels";
import { cn } from "@/lib/utils";
import { createProduct, updateProduct } from "../actions";
import { productSchema, slugify, type ProductInput } from "../schemas";

const ART = [
  { value: "chest", label: "Small chest logo" },
  { value: "back", label: "Large back print" },
  { value: "graphic", label: "Front graphic" },
  { value: "sleeve", label: "Sleeve mark" },
  { value: "none", label: "Plain" },
] as const;

export function ProductForm({ product, categories }: { product?: ProductInput & { id: string }; categories: { id: string; name: string; isActive: boolean }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!product);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      name: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      basePrice: undefined as unknown as number,
      discountPercent: null,
      status: "DRAFT",
      isFeatured: false,
      isNewArrival: true,
      isCustomizable: false,
      artPrint: "chest",
    },
  });
  const { errors } = form.formState;
  const slug = useWatch({ control: form.control, name: "slug" });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const res = product ? await updateProduct(product.id, values) : await createProduct(values);
      if (!res.ok) {
        setServerError(res.error);
        for (const [k, v] of Object.entries(res.fieldErrors ?? {})) if (v?.[0]) form.setError(k as keyof ProductInput, { message: v[0] });
        return;
      }
      if (!product && res.data && "id" in res.data) {
        router.push(`/admin/products/${res.data.id}?created=1`);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  });

  const nameField = form.register("name");

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card
        title="Product details"
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-[13px] text-[#166534]">Saved</span>}
            <button type="submit" disabled={pending} className={adminButton({ size: "sm" })}>
              {pending ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <input
              id="name"
              className={adminInput}
              aria-invalid={!!errors.name}
              {...nameField}
              onChange={(e) => {
                nameField.onChange(e);
                if (!slugTouched) form.setValue("slug", slugify(e.target.value), { shouldValidate: false });
              }}
            />
          </Field>
          <Field label="URL slug" htmlFor="slug" error={errors.slug?.message} hint={`/products/${slug || "…"}`}>
            <input id="slug" className={adminInput} aria-invalid={!!errors.slug} {...form.register("slug", { onChange: () => setSlugTouched(true) })} />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description?.message} className="md:col-span-2">
            <textarea id="description" rows={4} className={adminTextarea} aria-invalid={!!errors.description} {...form.register("description")} />
          </Field>
          <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
            <select id="categoryId" className={adminInput} {...form.register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Base price (LKR)" htmlFor="basePrice" error={errors.basePrice?.message} hint="Variants can override this.">
            <input id="basePrice" type="number" inputMode="decimal" step="0.01" min="0" className={adminInput} aria-invalid={!!errors.basePrice} {...form.register("basePrice", { valueAsNumber: true })} />
          </Field>
          <Field label="Discount (%)" htmlFor="discountPercent" error={errors.discountPercent?.message} hint="Leave empty for no sale. Applies to every size and colour, and is charged at checkout.">
            <input
              id="discountPercent"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="90"
              placeholder="e.g. 20"
              className={adminInput}
              aria-invalid={!!errors.discountPercent}
              {...form.register("discountPercent", { setValueAs: (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v)) })}
            />
          </Field>
          <Field label="Status" htmlFor="status" hint="Only Active products are shown in the store.">
            <select id="status" className={adminInput} {...form.register("status")}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Placeholder artwork" htmlFor="artPrint" hint="Shown until you upload photos.">
            <select id="artPrint" className={adminInput} {...form.register("artPrint")}>
              {ART.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="flex flex-wrap gap-x-8 gap-y-3 md:col-span-2">
            <legend className={cn(adminLabel, "mb-2")}>Visibility</legend>
            <Check label="Featured on home page" {...form.register("isFeatured")} />
            <Check label="Show in New arrivals" {...form.register("isNewArrival")} />
            <Check label="Customizable (custom print requests)" {...form.register("isCustomizable")} />
          </fieldset>
        </div>
        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      </Card>
    </form>
  );
}

function Field({ label, htmlFor, error, hint, className, children }: { label: string; htmlFor: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={adminLabel}>
        {label}
      </label>
      {children}
      {error ? <FormError message={error} /> : hint && <p className="text-xs text-smoke">{hint}</p>}
    </div>
  );
}

function Check({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" className="size-4 accent-ink" {...props} />
      {label}
    </label>
  );
}
