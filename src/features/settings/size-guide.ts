import { z } from "zod";
import type { GarmentKind } from "@/features/products/types";

/** One row of the size chart. Values are free text in cm, e.g. "56" or "56–58". Empty = not filled in yet. */
export interface SizeRow {
  size: string;
  chest: string;
  length: string;
  sleeve: string;
}
export type SizeGuide = Record<GarmentKind, SizeRow[]>;

export const SIZE_GUIDE_KINDS: { kind: GarmentKind; label: string }[] = [
  { kind: "tee", label: "T-shirts" },
  { kind: "hoodie", label: "Hoodies" },
];

const cell = z.string().trim().max(12);
const rowSchema = z.object({ size: z.string().trim().min(1, "Size is required").max(8), chest: cell, length: cell, sleeve: cell });
export const sizeGuideSchema = z.object({ tee: z.array(rowSchema).max(12), hoodie: z.array(rowSchema).max(12) });

const blankRows = () => ["S", "M", "L", "XL", "XXL"].map((size) => ({ size, chest: "", length: "", sleeve: "" }));

/** Reads whatever is stored (or nothing) into a complete guide. */
export function parseSizeGuide(value: unknown): SizeGuide {
  const parsed = sizeGuideSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return { tee: blankRows(), hoodie: blankRows() };
}

/** True once at least one measurement has been entered for this garment type. */
export function hasMeasurements(rows: SizeRow[]): boolean {
  return rows.some((r) => r.chest || r.length || r.sleeve);
}
