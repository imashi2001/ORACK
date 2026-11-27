/** Allowed discount range, in percent. */
export const MIN_DISCOUNT = 1;
export const MAX_DISCOUNT = 90;

/** A product's discount as a whole percentage, or null when there isn't a valid one. */
export function validDiscount(percent: number | null | undefined): number | null {
  if (percent == null || !Number.isInteger(percent) || percent < MIN_DISCOUNT || percent > MAX_DISCOUNT) return null;
  return percent;
}

/**
 * Price after the product's discount, rounded to the nearest rupee.
 * Used by both the storefront and the order service, so what customers see is what they're charged.
 */
export function discountedPrice(price: number, percent: number | null | undefined): number {
  const pct = validDiscount(percent);
  return pct ? Math.round((price * (100 - pct)) / 100) : price;
}
