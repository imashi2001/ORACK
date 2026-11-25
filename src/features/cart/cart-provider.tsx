"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { GarmentKind, PrintStyle, Tone } from "@/features/products/types";

/**
 * Client-side cart persisted to localStorage (and kept in sync across tabs).
 * Prices here are for display only: the server re-prices every line from
 * trusted data when the order is placed.
 */

export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  kind: GarmentKind;
  print: PrintStyle;
  colorName: string;
  /** Placeholder-art tone for the colour */
  tone: Tone;
  imageUrl?: string;
  size: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

export const MAX_QTY_PER_LINE = 10;
// Bump the version whenever CartLine's shape changes so old carts are ignored.
const STORAGE_KEY = "orack-cart-v2";

export type CartAction =
  | { type: "add"; line: CartLine }
  | { type: "setQty"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" };

function clampQty(q: number, max: number) {
  return Math.max(1, Math.min(q, max, MAX_QTY_PER_LINE));
}

/** Pure cart state transitions (exported for unit tests). */
export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = lines.find((l) => l.variantId === action.line.variantId);
      if (!existing) return [...lines, { ...action.line, quantity: clampQty(action.line.quantity, action.line.maxQuantity) }];
      return lines.map((l) =>
        l.variantId === action.line.variantId ? { ...l, quantity: clampQty(l.quantity + action.line.quantity, l.maxQuantity) } : l,
      );
    }
    case "setQty":
      return lines.map((l) => (l.variantId === action.variantId ? { ...l, quantity: clampQty(action.quantity, l.maxQuantity) } : l));
    case "remove":
      return lines.filter((l) => l.variantId !== action.variantId);
    case "clear":
      return [];
  }
}

// ── localStorage-backed external store ─────────────────────────────────────
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readCart(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function writeCart(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage full or blocked: the cart still works for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

const dispatch = (action: CartAction) => writeCart(cartReducer(readCart(), action));

// ── React context ──────────────────────────────────────────────────────────
interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addLine: (line: CartLine, opts?: { open?: boolean }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  const [isOpen, setOpen] = useState(false);

  const addLine = useCallback((line: CartLine, opts?: { open?: boolean }) => {
    dispatch({ type: "add", line });
    if (opts?.open ?? true) setOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0),
      isOpen,
      setOpen,
      addLine,
      setQuantity: (variantId, quantity) => dispatch({ type: "setQty", variantId, quantity }),
      removeLine: (variantId) => dispatch({ type: "remove", variantId }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [lines, isOpen, addLine],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
