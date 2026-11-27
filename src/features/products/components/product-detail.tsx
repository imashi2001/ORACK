"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useCart, MAX_QTY_PER_LINE } from "@/features/cart/cart-provider";
import { useStoreSettings } from "@/features/settings/store-settings-provider";
import { SizeChart } from "@/features/settings/size-chart";
import { hasMeasurements } from "@/features/settings/size-guide";
import { cta } from "@/components/shop/cta";
import { WhatsAppIcon } from "@/components/shop/icons";
import { Sticker, Tape } from "@/components/shop/street";
import { formatLKR } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { PrintStyle, Product } from "../types";
import { GarmentArt } from "./garment-art";
import { toCartLine } from "./to-cart-line";

const LOW_STOCK = 2;

type View = { key: string; label: string } & ({ kind: "image"; url: string; alt: string } | { kind: "art"; print: PrintStyle; zoom?: boolean });

export function ProductDetail({ product }: { product: Product }) {
  const { addLine } = useCart();
  const { whatsappNumber, deliveryInfo, sizeGuide } = useStoreSettings();
  const [colorName, setColorName] = useState(product.colours[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [viewIndex, setViewIndex] = useState(0);
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const colour = product.colours.find((c) => c.name === colorName) ?? product.colours[0];
  const photos = product.images.filter((i) => !i.colorName || i.colorName === colorName);
  const views: View[] = photos.length
    ? photos.map((p, i) => ({ key: p.id, label: `Photo ${i + 1}`, kind: "image", url: p.url, alt: p.alt || product.name }))
    : [
        { key: "front", label: "Front", kind: "art", print: product.print === "back" ? "chest" : product.print },
        { key: "back", label: "Back", kind: "art", print: product.print === "back" ? "back" : "none" },
        { key: "detail", label: "Print detail", kind: "art", print: product.print, zoom: true },
      ];
  const current = views[Math.min(viewIndex, views.length - 1)];
  const touchX = useRef<number | null>(null);
  const step = (dir: 1 | -1) => setViewIndex((i) => (Math.min(i, views.length - 1) + dir + views.length) % views.length);

  const variantFor = (s: string) => product.variants.find((v) => v.colorName === colorName && v.size === s);
  const selected = size ? variantFor(size) : undefined;
  const unitPrice = selected?.price ?? product.minPrice;
  const maxQty = Math.min(selected?.stock ?? MAX_QTY_PER_LINE, MAX_QTY_PER_LINE);

  const pickColour = (name: string) => {
    setColorName(name);
    setAdded(false);
    setViewIndex(0);
    if (size && !(product.variants.find((v) => v.colorName === name && v.size === size)?.stock ?? 0)) setSize(null);
  };

  const add = () => {
    if (!selected) {
      setNeedSize(true);
      return;
    }
    addLine(toCartLine(product, selected, qty));
    setAdded(true);
  };

  const stock = !selected
    ? { text: "Select a size to check availability", dot: "bg-[#9a9a97]" }
    : selected.stock <= LOW_STOCK
      ? { text: `Only ${selected.stock} left in ${selected.size}`, dot: "bg-[#c2410c]" }
      : { text: "In stock — ready to ship", dot: "bg-[#15803d]" };

  const askUrl = buildWhatsAppUrl(`Hi ORACK! I'm interested in the ${product.name} (${colorName}${size ? `, ${size}` : ""}).`, whatsappNumber);

  const renderView = (v: View, large: boolean) =>
    v.kind === "image" ? (
      <Image src={v.url} alt={v.alt} fill sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "96px"} priority={large} className="object-cover" />
    ) : (
      <GarmentArt
        kind={product.kind}
        tone={colour?.tone ?? "black"}
        print={v.print}
        shadow={large}
        title={large ? `${product.name} in ${colorName}, ${v.label.toLowerCase()}` : undefined}
        className={cn("relative", large ? (v.zoom ? "w-[150%]" : "w-[78%]") : cn("w-full", v.zoom && "scale-150"))}
      />
    );

  return (
    <div className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)]">
      {/* Gallery: thumbnails in a row under the photo on phones, a column beside it on larger screens. */}
      <div className="flex min-w-0 flex-[999_1_560px] flex-col-reverse gap-3 sm:flex-row sm:gap-4">
        <div role="group" aria-label="Product views" className="flex gap-2 overflow-x-auto sm:w-22 sm:shrink-0 sm:flex-col sm:gap-2.5 sm:overflow-visible">
          {views.map((v, i) => (
            <button
              key={v.key}
              type="button"
              aria-label={v.label}
              aria-pressed={current.key === v.key}
              onClick={() => setViewIndex(i)}
              className={cn(
                "relative flex aspect-[4/5] w-16 shrink-0 items-center justify-center overflow-hidden border-[1.5px] bg-mist sm:w-full",
                // Fixed padding: a % would be measured against the whole thumbnail row, not the button.
                v.kind === "art" && "p-2",
                current.key === v.key ? "border-ink" : "border-transparent hover:border-[#9a9a97]",
              )}
            >
              {renderView(v, false)}
            </button>
          ))}
        </div>
        <div
          className="group/gallery relative flex aspect-[4/5] min-w-0 flex-1 touch-pan-y items-center justify-center overflow-hidden bg-mist"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
          }}
        >
          {current.kind === "art" && <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#f7f7f5_0%,rgba(233,233,230,0)_62%)]" />}
          <Tape onLight className="-top-2.5 left-[30%]" rotate={-6} />
          <div key={current.key} className="animate-in fade-in absolute inset-0 flex items-center justify-center duration-300">
            {renderView(current, true)}
          </div>
          <span className="eyebrow absolute top-5 left-4 text-smoke sm:top-6 sm:left-5">{current.label}</span>
          {product.isCustomizable && (
            <span className="absolute top-5 right-4 sm:top-6 sm:right-5">
              <Sticker tone="dark" rotate={4}>
                Customizable
              </Sticker>
            </span>
          )}
          {views.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous view"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus-visible:opacity-100 sm:flex"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next view"
                onClick={() => step(1)}
                className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus-visible:opacity-100 sm:flex"
              >
                <ChevronRightIcon className="size-5" />
              </button>
              {/* Dots on phones, counter on larger screens */}
              <div aria-hidden="true" className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                {views.map((v) => (
                  <span key={v.key} className={cn("h-1.5 rounded-full transition-all", v.key === current.key ? "w-5 bg-ink" : "w-1.5 bg-ink/25")} />
                ))}
              </div>
            </>
          )}
          <span className="eyebrow absolute bottom-5 left-5 hidden text-smoke sm:block">
            {views.indexOf(current) + 1} / {views.length}
          </span>
        </div>
      </div>

      {/* Buy box */}
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-7 lg:sticky lg:top-26">
        <div className="flex flex-col gap-3.5">
          <span className="eyebrow text-smoke">{product.category.name}</span>
          <h1 className="display text-[clamp(52px,5.5vw,80px)]">{product.name}</h1>
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <span className="text-2xl font-bold">{formatLKR(unitPrice)}</span>
            {product.discountPercent ? (
              <>
                <s className="text-lg text-smoke">
                  <span className="sr-only">Was </span>
                  {formatLKR(selected?.compareAtPrice ?? product.compareAtMinPrice)}
                </s>
                <span className="bg-ink px-2 py-0.5 font-mono text-[12px] font-bold tracking-wider text-white">SAVE {product.discountPercent}%</span>
              </>
            ) : (
              <span className="text-[13px] text-smoke">Price in LKR</span>
            )}
          </div>
          <p className="text-base leading-relaxed whitespace-pre-line text-graphite">{product.description}</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">
            Colour: <span className="font-normal">{colorName}</span>
          </span>
          <div role="group" aria-label="Colour" className="flex flex-wrap gap-3.5">
            {product.colours.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={`${c.name} colour`}
                aria-pressed={c.name === colorName}
                onClick={() => pickColour(c.name)}
                style={{ backgroundColor: c.hex }}
                className={cn("size-8 rounded-full border border-black/25", c.name === colorName && "shadow-[0_0_0_3px_#f3f3f1,0_0_0_4.5px_#0a0a0a]")}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Size: <span className="font-normal">{size ?? "Select"}</span>
            </span>
            <button type="button" onClick={() => setGuideOpen((v) => !v)} aria-expanded={guideOpen} className="py-2 text-[13px] underline underline-offset-3">
              Size guide
            </button>
          </div>
          <div id="size-picker" role="group" aria-label="Size" className="scroll-mt-28 grid grid-cols-[repeat(auto-fit,minmax(56px,1fr))] gap-2">
            {product.sizes.map((s) => {
              const v = variantFor(s);
              const out = !v || v.stock === 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  aria-pressed={size === s}
                  aria-label={out ? `${s}, out of stock` : s}
                  onClick={() => {
                    setSize(s);
                    setNeedSize(false);
                    setAdded(false);
                    setQty((q) => Math.max(1, Math.min(q, v?.stock ?? 1)));
                  }}
                  className={cn(
                    "h-12 border-[1.5px] text-sm font-semibold",
                    size === s ? "border-ink bg-ink text-white" : "border-[#d0d0cd] bg-white hover:border-ink",
                    "disabled:cursor-not-allowed disabled:bg-[repeating-linear-gradient(135deg,#fff_0_6px,#f0f0ee_6px_7px)] disabled:text-[#9a9a97] disabled:line-through disabled:hover:border-[#d0d0cd]",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-graphite">
            <span className={cn("size-2 rounded-full", stock.dot)} aria-hidden="true" />
            <span aria-live="polite">{stock.text}</span>
          </div>
          {guideOpen && (
            <div className="flex flex-col gap-3 border border-[#e3e3e0] bg-white p-4.5">
              {hasMeasurements(sizeGuide[product.kind]) ? (
                <SizeChart rows={sizeGuide[product.kind]} highlight={size} />
              ) : (
                <p className="text-sm leading-relaxed text-graphite">
                  Our fits are oversized and relaxed. If you&apos;re between sizes, go with your usual size for the boxy look, or one down for a closer fit.
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                <Link href="/size-guide" className="font-semibold underline underline-offset-3">
                  How to measure
                </Link>
                <a href={buildWhatsAppUrl(`Hi ORACK! Can you help me pick a size for the ${product.name}?`, whatsappNumber)} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-3">
                  Ask us about fit
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2.5">
            <div className="inline-flex h-14 items-center border-[1.5px] border-ink">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="flex h-full w-12 items-center justify-center disabled:opacity-40">
                <MinusIcon className="size-3.5" />
              </button>
              <span className="min-w-8 text-center font-bold" aria-live="polite">
                {qty}
              </span>
              <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)} className="flex h-full w-12 items-center justify-center disabled:opacity-40">
                <PlusIcon className="size-3.5" />
              </button>
            </div>
            <button type="button" onClick={add} className={cta({ className: "min-h-14 flex-[1_1_220px]" })}>
              {added ? (
                <>
                  Added to bag <CheckIcon />
                </>
              ) : (
                `Add to bag — ${formatLKR(unitPrice * qty)}`
              )}
            </button>
          </div>
          {needSize && (
            <p role="alert" className="text-[13px] font-semibold text-destructive">
              Please choose a size first.
            </p>
          )}
          <a href={askUrl} target="_blank" rel="noopener noreferrer" className={cta({ tone: "outline-dark", className: "min-h-14" })}>
            <WhatsAppIcon /> Ask about this on WhatsApp
          </a>
        </div>

        {product.isCustomizable && (
          <Link href={`/customize?product=${product.slug}`} className="flex items-center justify-between gap-4 bg-ink px-5 py-4.5 text-white">
            <span className="flex flex-col gap-1">
              <span className="eyebrow text-[10px] text-[#a3a3a3]">Custom studio</span>
              <span className="text-[15px] font-semibold">Want your own print on this?</span>
            </span>
            <ArrowRightIcon className="size-4.5" />
          </Link>
        )}

        <div>
          {[
            { title: "Care", body: "Wash inside out, cold. Do not iron directly on the print." },
            { title: "Delivery & returns", body: deliveryInfo || "Islandwide delivery across Sri Lanka. Delivery fee and timing are confirmed with you on WhatsApp." },
          ].map((s) => (
            <details key={s.title} className="group border-t border-line last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                {s.title}
                <PlusIcon className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-[15px] leading-relaxed whitespace-pre-line text-graphite">{s.body}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Phones: keep the main action in reach while scrolling. */}
      <div data-sticky-buy className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-[13px] text-graphite">
            {formatLKR(unitPrice)} · {colorName}
            {size ? ` / ${size}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!selected) {
              setNeedSize(true);
              document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
            add();
          }}
          className={cta({ className: "min-h-12 shrink-0 px-5" })}
        >
          {added ? "Added" : selected ? "Add to bag" : "Choose size"}
        </button>
      </div>
    </div>
  );
}
