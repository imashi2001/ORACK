import type { CartLine } from "@/features/cart/cart-provider";
import type { Product, ProductVariant } from "../types";

export function toCartLine(product: Product, variant: ProductVariant, quantity = 1): CartLine {
  const colour = product.colours.find((c) => c.name === variant.colorName);
  const image = product.images.find((i) => i.colorName === variant.colorName) ?? product.images[0];
  return {
    variantId: variant.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    kind: product.kind,
    print: product.print,
    colorName: variant.colorName,
    tone: colour?.tone ?? "black",
    imageUrl: image?.url,
    size: variant.size,
    unitPrice: variant.price,
    quantity,
    maxQuantity: variant.stock,
  };
}
