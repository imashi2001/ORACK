"use client";

import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { adminButton, adminInput, Card, FormError } from "@/features/admin/components/ui";
import type { GarmentKind } from "@/features/products/types";
import { saveSizeGuide } from "./actions";
import { SIZE_GUIDE_KINDS, type SizeGuide, type SizeRow } from "./size-guide";

const COLS: { key: keyof SizeRow; label: string; placeholder: string }[] = [
  { key: "size", label: "Size", placeholder: "M" },
  { key: "chest", label: "Chest (cm)", placeholder: "56" },
  { key: "length", label: "Length (cm)", placeholder: "72" },
  { key: "sleeve", label: "Sleeve (cm)", placeholder: "22" },
];

export function SizeGuideForm({ initial }: { initial: SizeGuide }) {
  const [guide, setGuide] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (kind: GarmentKind, fn: (rows: SizeRow[]) => SizeRow[]) => {
    setSaved(false);
    setGuide((g) => ({ ...g, [kind]: fn(g[kind]) }));
  };

  const save = () =>
    startTransition(async () => {
      setError(null);
      const res = await saveSizeGuide(guide);
      if (!res.ok) return setError(res.error);
      setSaved(true);
    });

  return (
    <Card title="Size guide" description="Measurements shown on product pages and the Size guide page. Leave a cell empty if you don't have it; empty charts show fit advice instead.">
      <div className="flex flex-col gap-8">
        {SIZE_GUIDE_KINDS.map(({ kind, label }) => (
          <fieldset key={kind} className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold">{label}</legend>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    {COLS.map((c) => (
                      <th key={c.key} scope="col" className="pb-2 text-left text-xs font-semibold text-smoke">
                        {c.label}
                      </th>
                    ))}
                    <th className="sr-only">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {guide[kind].map((row, i) => (
                    <tr key={i}>
                      {COLS.map((c) => (
                        <td key={c.key} className="pr-2 pb-2">
                          <input
                            aria-label={`${label} ${row.size || "row " + (i + 1)} ${c.label}`}
                            className={adminInput}
                            value={row[c.key]}
                            placeholder={c.placeholder}
                            maxLength={c.key === "size" ? 8 : 12}
                            inputMode={c.key === "size" ? "text" : "decimal"}
                            onChange={(e) => update(kind, (rows) => rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                          />
                        </td>
                      ))}
                      <td className="pb-2">
                        <button
                          type="button"
                          aria-label={`Remove ${row.size || "row"}`}
                          onClick={() => update(kind, (rows) => rows.filter((_, j) => j !== i))}
                          className={adminButton({ variant: "secondary", size: "sm" })}
                        >
                          <Trash2Icon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {guide[kind].length < 12 && (
              <button
                type="button"
                onClick={() => update(kind, (rows) => [...rows, { size: "", chest: "", length: "", sleeve: "" }])}
                className={adminButton({ variant: "secondary", size: "sm", className: "self-start" })}
              >
                <PlusIcon /> Add size
              </button>
            )}
          </fieldset>
        ))}
        <div className="flex items-center gap-4">
          <button type="button" disabled={pending} onClick={save} className={adminButton({ size: "md" })}>
            {pending ? "Saving…" : "Save size guide"}
          </button>
          {saved && <span className="text-sm text-[#166534]">Saved. The store is updated.</span>}
        </div>
        <FormError message={error} />
      </div>
    </Card>
  );
}
