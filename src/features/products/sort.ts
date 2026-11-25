import { SIZE_ORDER, type Product, type ProductSort } from "./types";

export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const copy = list.slice();
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return copy.sort((a, b) => a.minPrice - b.minPrice);
    case "price-desc":
      return copy.sort((a, b) => b.minPrice - a.minPrice);
    default:
      return copy.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt));
  }
}

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}
