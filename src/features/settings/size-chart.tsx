import { cn } from "@/lib/utils";
import type { SizeRow } from "./size-guide";

/** Read-only size chart (cm). Highlights the selected size when given. */
export function SizeChart({ rows, highlight, className }: { rows: SizeRow[]; highlight?: string | null; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[300px] border-collapse text-left text-sm tabular-nums">
        <caption className="eyebrow pb-2 text-left text-smoke">Garment measurements (cm)</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            {["Size", "Chest", "Length", "Sleeve"].map((h) => (
              <th key={h} scope="col" className="px-2.5 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.size} className={cn("border-b border-[#e3e3e0]", highlight === r.size && "bg-ink text-white")}>
              <th scope="row" className="px-2.5 py-2.5 font-semibold">
                {r.size}
              </th>
              <td className="px-2.5 py-2.5">{r.chest || "—"}</td>
              <td className="px-2.5 py-2.5">{r.length || "—"}</td>
              <td className="px-2.5 py-2.5">{r.sleeve || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const MEASURE_TIPS = [
  { title: "Chest", body: "Lay the garment flat and measure straight across, armpit to armpit, then double it." },
  { title: "Length", body: "From the highest point of the shoulder, next to the collar, down to the hem." },
  { title: "Sleeve", body: "From the shoulder seam to the end of the sleeve." },
];
