"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { useCart } from "@/features/cart/cart-provider";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "../types";
import { ProductVisual } from "./product-visual";
import { toCartLine } from "./to-cart-line";

export function ProductCard({ product, surface = "paper" }: { product: Product; surface?: "paper" | "white" }) {
  const { addLine } = useCart();
  const [colorName, setColorName] = useState(product.colours[0]?.name ?? "");
  const [quickOpen, setQuickOpen] = useState(false);
  const href = `/products/${product.slug}`;
  const hasPhoto = product.images.length > 0;
  const priceLabel = product.minPrice < product.price ? `From ${formatLKR(product.minPrice)}` : formatLKR(product.minPrice);

  return (
    <article className="group/card flex flex-col gap-3.5">
      <div className={cn("relative aspect-[4/5] overflow-hidden transition-colors group-hover/card:bg-[#e2e2df]", surface === "paper" ? "bg-mist" : "bg-[#eeeeeb]")}>
        <Link
          href={href}
          aria-label={product.name}
          className={cn("absolute inset-0 flex items-center justify-center", !hasPhoto && "px-[9%] pt-[12%] pb-[20%]")}
        >
          <ProductVisual
            product={product}
            colorName={colorName}
            className="w-full transition-transform duration-500 group-hover/card:-translate-y-1.5 group-hover/card:scale-[1.03]"
          />
        </Link>
        {product.tag && (
          <span className={cn("eyebrow absolute top-3.5 left-3.5 px-2 py-1.5 text-[10px]", surface === "paper" ? "bg-ink text-white" : "border border-ink bg-white text-ink")}>
            {product.tag}
          </span>
        )}

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          {!quickOpen ? (
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="flex min-h-11.5 w-full items-center justify-center gap-2.5 bg-ink text-[13px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#2c2c2c]"
            >
              Quick add <PlusIcon className="size-3.5" />
            </button>
          ) : (
            <div className="flex flex-col gap-2.5 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[10px] text-smoke">Select size · {colorName}</span>
                <button type="button" onClick={() => setQuickOpen(false)} aria-label="Close sizes" className="p-1">
                  <XIcon className="size-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(40px,1fr))] gap-1.5">
                {product.sizes.map((size) => {
                  const variant = product.variants.find((v) => v.colorName === colorName && v.size === size);
                  const out = !variant || variant.stock === 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={out}
                      aria-label={out ? `${size}, out of stock` : `Add size ${size}`}
                      onClick={() => {
                        if (!variant) return;
                        addLine(toCartLine(product, variant));
                        setQuickOpen(false);
                      }}
                      className="h-10 border-[1.5px] border-[#d0d0cd] bg-white text-[13px] font-semibold hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:text-[#9a9a97] disabled:line-through disabled:hover:border-[#d0d0cd] disabled:hover:bg-white"
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Link href={href} className="text-base font-semibold">
            {product.name}
          </Link>
          <span className="text-[15px] text-graphite">{priceLabel}</span>
        </div>
        <span className="eyebrow pt-1 text-[10px] text-smoke">
          {product.colours.length} {product.colours.length === 1 ? "colour" : "colours"}
        </span>
      </div>

      <div className="flex items-center gap-2.5" role="group" aria-label={`${product.name} colours`}>
        {product.colours.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-label={`${c.name} colour`}
            aria-pressed={c.name === colorName}
            onClick={() => setColorName(c.name)}
            style={{ backgroundColor: c.hex }}
            className={cn(
              "size-5.5 rounded-full border border-black/25",
              c.name === colorName && (surface === "paper" ? "shadow-[0_0_0_2px_#f3f3f1,0_0_0_3.5px_#0a0a0a]" : "shadow-[0_0_0_2px_#fff,0_0_0_3.5px_#0a0a0a]"),
            )}
          />
        ))}
      </div>
    </article>
  );
}
