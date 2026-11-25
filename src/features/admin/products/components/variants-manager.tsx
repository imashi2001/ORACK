"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { adminButton, adminInput, adminLabel, Badge, Card, EmptyState, FormError } from "@/features/admin/components/ui";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteVariant, generateVariants, saveVariant, setVariantStock } from "../actions";
import type { AdminProduct } from "../queries";

type Variant = AdminProduct["variants"][number];

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const PRESET_COLOURS = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f4f4f2" },
  { name: "Ash", hex: "#a6a6a3" },
  { name: "Charcoal", hex: "#454545" },
];

export function VariantsManager({ productId, basePrice, variants }: { productId: string; basePrice: number; variants: Variant[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Variant | "new" | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });

  const totalStock = variants.filter((v) => v.isActive).reduce((n, v) => n + v.stockQuantity, 0);

  return (
    <Card
      title="Variants & stock"
      description={`${variants.length} variants · ${totalStock} in stock (active)`}
      actions={
        <div className="flex gap-2">
          <button type="button" className={adminButton({ variant: "secondary", size: "sm" })} onClick={() => setGeneratorOpen((v) => !v)}>
            Bulk add
          </button>
          <button type="button" className={adminButton({ size: "sm" })} onClick={() => setEditing("new")}>
            <PlusIcon /> Add variant
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {generatorOpen && <Generator productId={productId} onDone={() => { setGeneratorOpen(false); router.refresh(); }} />}
        {editing && (
          <VariantEditor
            productId={productId}
            variant={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
        <FormError message={error} />

        {variants.length === 0 ? (
          <EmptyState title="No variants yet">Add at least one size and colour, otherwise the product can&apos;t be bought.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-smoke">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Colour</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Size</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">SKU</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Price</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Stock</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Status</th>
                  <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {variants.map((v) => (
                  <tr key={v.id} className={cn(!v.isActive && "text-smoke")}>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="size-4 rounded-full border border-black/20" style={{ backgroundColor: v.colorHex }} aria-hidden="true" />
                        {v.colorName}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-semibold">{v.size}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{v.sku}</td>
                    <td className="py-2 pr-3">{v.price != null ? formatLKR(v.price) : <span className="text-smoke">{formatLKR(basePrice)}</span>}</td>
                    <td className="py-2 pr-3">
                      <StockInput value={v.stockQuantity} disabled={pending} label={`Stock for ${v.colorName} ${v.size}`} onCommit={(n) => run(() => setVariantStock(productId, v.id, n))} />
                    </td>
                    <td className="py-2 pr-3">{v.isActive ? <Badge tone="green">Active</Badge> : <Badge>Hidden</Badge>}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button type="button" className={adminButton({ variant: "ghost", size: "sm" })} onClick={() => setEditing(v)} aria-label={`Edit ${v.colorName} ${v.size}`}>
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className={adminButton({ variant: "ghost", size: "sm" })}
                        aria-label={`Delete ${v.colorName} ${v.size}`}
                        onClick={() => {
                          if (confirm(`Delete the ${v.colorName} / ${v.size} variant? Past orders keep their details.`)) run(() => deleteVariant(productId, v.id));
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
        )}
      </div>
    </Card>
  );
}

function StockInput({ value, onCommit, disabled, label }: { value: number; onCommit: (n: number) => void; disabled?: boolean; label: string }) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    // Server value changed (after refresh): reset the draft.
    setLastValue(value);
    setDraft(String(value));
  }
  const commit = () => {
    const n = Number(draft);
    if (Number.isInteger(n) && n >= 0 && n !== value) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <input
      type="number"
      min={0}
      step={1}
      aria-label={label}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
      className={cn(adminInput, "h-9 w-20", value === 0 && "border-[#f1c9c6] text-destructive")}
    />
  );
}

function VariantEditor({ productId, variant, onClose, onSaved }: { productId: string; variant: Variant | null; onClose: () => void; onSaved: () => void }) {
  const [state, setState] = useState({
    colorName: variant?.colorName ?? "Black",
    colorHex: variant?.colorHex ?? "#111111",
    size: variant?.size ?? "M",
    price: variant?.price != null ? String(variant.price) : "",
    stockQuantity: String(variant?.stockQuantity ?? 0),
    sku: variant?.sku ?? "",
    isActive: variant?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof state, v: string | boolean) => setState((s) => ({ ...s, [k]: v }));

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const res = await saveVariant(productId, variant?.id ?? null, {
        colorName: state.colorName,
        colorHex: state.colorHex,
        size: state.size,
        price: state.price.trim() === "" ? null : Number(state.price),
        stockQuantity: Number(state.stockQuantity),
        sku: state.sku || undefined,
        isActive: state.isActive,
      });
      if (!res.ok) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
        return;
      }
      onSaved();
    });

  return (
    <div className="border border-ink bg-paper p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">{variant ? `Edit ${variant.colorName} / ${variant.size}` : "New variant"}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className={adminButton({ variant: "ghost", size: "sm" })}>
          <XIcon />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Colour name</span>
          <input className={adminInput} value={state.colorName} onChange={(e) => set("colorName", e.target.value)} list="colour-presets" />
          <datalist id="colour-presets">{PRESET_COLOURS.map((c) => <option key={c.name} value={c.name} />)}</datalist>
          <FormError message={errors.colorName?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Swatch</span>
          <span className="flex gap-2">
            <input type="color" className="h-11 w-12 border border-line bg-white p-1" value={state.colorHex} onChange={(e) => set("colorHex", e.target.value)} aria-label="Swatch colour" />
            <input className={adminInput} value={state.colorHex} onChange={(e) => set("colorHex", e.target.value)} aria-label="Swatch hex" />
          </span>
          <FormError message={errors.colorHex?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Size</span>
          <input className={adminInput} value={state.size} onChange={(e) => set("size", e.target.value)} list="size-presets" />
          <datalist id="size-presets">{PRESET_SIZES.map((s) => <option key={s} value={s} />)}</datalist>
          <FormError message={errors.size?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Stock</span>
          <input type="number" min={0} className={adminInput} value={state.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} />
          <FormError message={errors.stockQuantity?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Price override (LKR)</span>
          <input type="number" min={0} step="0.01" placeholder="Base price" className={adminInput} value={state.price} onChange={(e) => set("price", e.target.value)} />
          <FormError message={errors.price?.[0]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>SKU</span>
          <input className={adminInput} placeholder="Auto" value={state.sku} onChange={(e) => set("sku", e.target.value)} />
          <FormError message={errors.sku?.[0]} />
        </label>
        <label className="flex items-center gap-2.5 self-end pb-3 text-sm">
          <input type="checkbox" className="size-4 accent-ink" checked={state.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active (can be bought)
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={pending} onClick={submit} className={adminButton({ size: "sm" })}>
          {pending ? "Saving…" : "Save variant"}
        </button>
        <FormError message={error} />
      </div>
    </div>
  );
}

function Generator({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL"]);
  const [colours, setColours] = useState(PRESET_COLOURS.slice(0, 2));
  const [stock, setStock] = useState("0");
  const [newColour, setNewColour] = useState({ name: "", hex: "#888888" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4 border border-ink bg-paper p-4">
      <h3 className="text-sm font-bold">Bulk add size × colour combinations</h3>
      <fieldset className="flex flex-wrap gap-2">
        <legend className={cn(adminLabel, "mb-2")}>Sizes</legend>
        {PRESET_SIZES.map((s) => {
          const on = sizes.includes(s);
          return (
            <button key={s} type="button" aria-pressed={on} onClick={() => setSizes(on ? sizes.filter((x) => x !== s) : [...sizes, s])} className={cn("h-9 min-w-12 border px-3 text-sm font-semibold", on ? "border-ink bg-ink text-white" : "border-line bg-white")}>
              {s}
            </button>
          );
        })}
      </fieldset>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className={cn(adminLabel, "mb-2")}>Colours</legend>
        {colours.map((c) => (
          <span key={c.name} className="inline-flex h-9 items-center gap-2 border border-line bg-white pr-1 pl-3 text-sm">
            <span className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} aria-hidden="true" />
            {c.name}
            <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setColours(colours.filter((x) => x.name !== c.name))} className="p-1.5">
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        {PRESET_COLOURS.filter((p) => !colours.some((c) => c.name === p.name)).map((p) => (
          <button key={p.name} type="button" onClick={() => setColours([...colours, p])} className="h-9 border border-dashed border-line px-3 text-sm text-smoke hover:border-ink hover:text-ink">
            + {p.name}
          </button>
        ))}
        <span className="flex items-center gap-1.5">
          <input className={cn(adminInput, "h-9 w-28")} placeholder="Other colour" value={newColour.name} onChange={(e) => setNewColour({ ...newColour, name: e.target.value })} aria-label="New colour name" />
          <input type="color" className="h-9 w-10 border border-line bg-white p-0.5" value={newColour.hex} onChange={(e) => setNewColour({ ...newColour, hex: e.target.value })} aria-label="New colour swatch" />
          <button
            type="button"
            className={adminButton({ variant: "secondary", size: "sm" })}
            onClick={() => {
              if (newColour.name.trim() && !colours.some((c) => c.name === newColour.name.trim())) setColours([...colours, { name: newColour.name.trim(), hex: newColour.hex }]);
              setNewColour({ name: "", hex: "#888888" });
            }}
          >
            Add
          </button>
        </span>
      </fieldset>
      <label className="flex w-40 flex-col gap-1.5">
        <span className={adminLabel}>Starting stock each</span>
        <input type="number" min={0} className={adminInput} value={stock} onChange={(e) => setStock(e.target.value)} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className={adminButton({ size: "sm" })}
          onClick={() =>
            startTransition(async () => {
              const res = await generateVariants(productId, { sizes, colours, stockQuantity: Number(stock) });
              if (!res.ok) return setMessage(res.error);
              setMessage(null);
              onDone();
            })
          }
        >
          {pending ? "Creating…" : `Create ${sizes.length * colours.length} combinations`}
        </button>
        <span className="text-xs text-smoke">Existing combinations are skipped.</span>
        <FormError message={message} />
      </div>
    </div>
  );
}
