import { describe, expect, it } from "vitest";
import { cartReducer, MAX_QTY_PER_LINE, type CartLine } from "@/features/cart/cart-provider";
import { compareSizes, sortProducts } from "@/features/products/sort";
import { toneFromHex } from "@/features/products/tones";
import type { Product } from "@/features/products/types";

const line = (over: Partial<CartLine> = {}): CartLine => ({
  variantId: "v1",
  productId: "p1",
  slug: "tee",
  name: "Tee",
  kind: "tee",
  print: "chest",
  colorName: "Black",
  tone: "black",
  size: "M",
  unitPrice: 2500,
  quantity: 1,
  maxQuantity: 5,
  ...over,
});

describe("cartReducer", () => {
  it("adds a new line and merges the same variant", () => {
    let state = cartReducer([], { type: "add", line: line() });
    state = cartReducer(state, { type: "add", line: line({ quantity: 2 }) });
    expect(state).toHaveLength(1);
    expect(state[0].quantity).toBe(3);
  });

  it("never exceeds available stock or the per-line cap", () => {
    let state = cartReducer([], { type: "add", line: line({ quantity: 4, maxQuantity: 5 }) });
    state = cartReducer(state, { type: "add", line: line({ quantity: 4, maxQuantity: 5 }) });
    expect(state[0].quantity).toBe(5);
    state = cartReducer([], { type: "add", line: line({ quantity: 50, maxQuantity: 100 }) });
    expect(state[0].quantity).toBe(MAX_QTY_PER_LINE);
  });

  it("keeps quantity at least 1, and removes and clears lines", () => {
    let state = cartReducer([line()], { type: "setQty", variantId: "v1", quantity: 0 });
    expect(state[0].quantity).toBe(1);
    state = cartReducer([line(), line({ variantId: "v2" })], { type: "remove", variantId: "v1" });
    expect(state.map((l) => l.variantId)).toEqual(["v2"]);
    expect(cartReducer(state, { type: "clear" })).toEqual([]);
  });
});

describe("sizes and sorting", () => {
  it("orders sizes naturally, unknown sizes last", () => {
    expect(["XL", "S", "28", "M", "XXL", "L"].sort(compareSizes)).toEqual(["S", "M", "L", "XL", "XXL", "28"]);
  });

  const p = (id: string, minPrice: number, createdAt: string, isFeatured = false) => ({ id, minPrice, createdAt, isFeatured }) as Product;
  const list = [p("a", 3000, "2026-01-01"), p("b", 1000, "2026-03-01", true), p("c", 2000, "2026-02-01")];

  it("sorts by price and date", () => {
    expect(sortProducts(list, "price-asc").map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(sortProducts(list, "price-desc").map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(sortProducts(list, "newest").map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(sortProducts(list, "featured")[0].id).toBe("b");
  });

  it("does not mutate the input", () => {
    const copy = [...list];
    sortProducts(list, "price-asc");
    expect(list).toEqual(copy);
  });
});

describe("toneFromHex", () => {
  it.each([
    ["#111111", "black"],
    ["#f4f4f2", "white"],
    ["#a6a6a3", "ash"],
    ["#454545", "charcoal"],
    ["not-a-colour", "black"],
  ])("%s → %s", (hex, tone) => {
    expect(toneFromHex(hex)).toBe(tone);
  });
});
