"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { adminButton, adminInput, adminLabel, Badge, Card, FormError } from "@/features/admin/components/ui";
import { slugify } from "@/features/admin/products/schemas";
import { deleteCategory, saveCategory } from "./actions";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      {editing ? (
        <CategoryEditor
          category={editing === "new" ? null : editing}
          nextSort={(categories.at(-1)?.sortOrder ?? 0) + 1}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div>
          <button type="button" className={adminButton()} onClick={() => setEditing("new")}>
            <PlusIcon /> New category
          </button>
        </div>
      )}
      <FormError message={error} />
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-smoke">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Order</th>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Slug</th>
              <th scope="col" className="px-4 py-3 font-semibold">Products</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-smoke">{c.sortOrder}</td>
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.productCount}</td>
                <td className="px-4 py-3">{c.isActive ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" className={adminButton({ variant: "ghost", size: "sm" })} onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className={adminButton({ variant: "ghost", size: "sm" })}
                    aria-label={`Delete ${c.name}`}
                    onClick={() => {
                      if (!confirm(`Delete category "${c.name}"?`)) return;
                      startTransition(async () => {
                        const res = await deleteCategory(c.id);
                        if (!res.ok) setError(res.error);
                        else {
                          setError(null);
                          router.refresh();
                        }
                      });
                    }}
                  >
                    <Trash2Icon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryEditor({ category, nextSort, onDone, onCancel }: { category: CategoryRow | null; nextSort: number; onDone: () => void; onCancel: () => void }) {
  const [s, setS] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    tagline: category?.tagline ?? "",
    sortOrder: String(category?.sortOrder ?? nextSort),
    isActive: category?.isActive ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card title={category ? `Edit ${category.name}` : "New category"}>
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await saveCategory(category?.id ?? null, { ...s, sortOrder: Number(s.sortOrder) });
            if (!res.ok) {
              setError(res.error);
              setErrors(res.fieldErrors ?? {});
              return;
            }
            onDone();
          });
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Name</span>
          <input
            className={adminInput}
            value={s.name}
            onChange={(e) => setS({ ...s, name: e.target.value, slug: slugTouched ? s.slug : slugify(e.target.value) })}
          />
          <FormError message={errors.name?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Slug</span>
          <input
            className={adminInput}
            value={s.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setS({ ...s, slug: e.target.value });
            }}
          />
          <FormError message={errors.slug?.[0]} />
          <span className="text-xs text-smoke">Slugs containing “hood” use the hoodie placeholder artwork.</span>
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={adminLabel}>Description</span>
          <input className={adminInput} value={s.description} onChange={(e) => setS({ ...s, description: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={adminLabel}>Homepage card line</span>
          <input className={adminInput} value={s.tagline} maxLength={80} placeholder="Essential fits for every style." onChange={(e) => setS({ ...s, tagline: e.target.value })} />
          <span className="text-xs text-smoke">Short line on this category&apos;s homepage card. Change the card photo in Homepage.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Sort order</span>
          <input type="number" min={0} className={adminInput} value={s.sortOrder} onChange={(e) => setS({ ...s, sortOrder: e.target.value })} />
        </label>
        <label className="flex items-center gap-2.5 self-end pb-3 text-sm">
          <input type="checkbox" className="size-4 accent-ink" checked={s.isActive} onChange={(e) => setS({ ...s, isActive: e.target.checked })} />
          Visible in the store
          <span className="text-xs text-smoke">(untick to pause: hides its menu link, homepage card and products)</span>
        </label>
        <div className="flex items-center gap-3 md:col-span-2">
          <button type="submit" disabled={pending} className={adminButton()}>
            {pending ? "Saving…" : "Save category"}
          </button>
          <button type="button" onClick={onCancel} className={adminButton({ variant: "ghost" })}>
            Cancel
          </button>
          <FormError message={error} />
        </div>
      </form>
    </Card>
  );
}
