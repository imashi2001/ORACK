/** Placeholder-artwork palette, picked from a colour's hex until real photos exist. */
export type Tone = "black" | "white" | "ash" | "charcoal";
export type GarmentKind = "tee" | "hoodie";
export type PrintStyle = "chest" | "back" | "graphic" | "sleeve" | "none";

export const PRINT_STYLES: PrintStyle[] = ["chest", "back", "graphic", "sleeve", "none"];

/** Display order for sizes. Unknown sizes sort to the end alphabetically. */
export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
export const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

export interface ColourOption {
  name: string;
  hex: string;
  tone: Tone;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  /** LKR the customer pays: variant override or base price, after any discount */
  price: number;
  /** Price before the discount; equals price when there's no discount */
  compareAtPrice: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  colorName: string | null;
}

export interface CategoryRef {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CategoryRef;
  kind: GarmentKind;
  print: PrintStyle;
  /** Base price in LKR */
  price: number;
  /** Lowest active variant price after discount, for "from" labels */
  minPrice: number;
  /** Lowest active variant price before discount */
  compareAtMinPrice: number;
  /** Whole percent off, or null */
  discountPercent: number | null;
  colours: ColourOption[];
  sizes: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  tag?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  /** ISO date */
  createdAt: string;
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";
