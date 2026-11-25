import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PrintStyle, Product } from "../types";
import { GarmentArt } from "./garment-art";

/**
 * Shows the product's uploaded photo for the chosen colour (or its primary photo).
 * Falls back to the vector placeholder when no photos exist yet.
 */
export function ProductVisual({
  product,
  colorName,
  print,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  shadow,
}: {
  product: Pick<Product, "name" | "kind" | "print" | "colours" | "images">;
  colorName?: string;
  print?: PrintStyle;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shadow?: boolean;
}) {
  const image = product.images.find((i) => i.colorName === colorName) ?? product.images[0];
  if (image) {
    return (
      <span className={cn("relative block aspect-[4/5] w-full", className)}>
        <Image src={image.url} alt={image.alt || product.name} fill sizes={sizes} priority={priority} className="object-cover" />
      </span>
    );
  }
  const colour = product.colours.find((c) => c.name === colorName) ?? product.colours[0];
  return <GarmentArt kind={product.kind} tone={colour?.tone ?? "black"} print={print ?? product.print} shadow={shadow} className={className} />;
}
