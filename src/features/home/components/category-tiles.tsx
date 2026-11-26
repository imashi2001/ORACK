import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Reveal } from "@/components/shop/reveal";
import { Sticker } from "@/components/shop/street";
import { GarmentArt } from "@/features/products/components/garment-art";
import type { GarmentKind, PrintStyle, Tone } from "@/features/products/types";
import { cn } from "@/lib/utils";

const TILES: { index: string; sticker: string; title: string[]; sub: string; cta: string; href: string; light?: boolean; art: { kind: GarmentKind; tone: Tone; print: PrintStyle } }[] = [
  { index: "01", sticker: "Everyday", title: ["T-Shirts"], sub: "Essential fits for every style.", cta: "Explore", href: "/products?category=t-shirts", art: { kind: "tee", tone: "black", print: "chest" } },
  { index: "02", sticker: "Layer up", title: ["Hoodies"], sub: "Premium comfort. Street-ready.", cta: "Explore", href: "/products?category=hoodies", art: { kind: "hoodie", tone: "ash", print: "chest" } },
  { index: "03", sticker: "Studio", title: ["Custom", "Designs"], sub: "Your design. Our craft.", cta: "Create now", href: "/customize", light: true, art: { kind: "tee", tone: "black", print: "graphic" } },
];

export function CategoryTiles() {
  return (
    <section aria-label="Shop by category" className="bg-ink pb-3">
      <div className="mx-auto grid max-w-[1360px] grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3 px-3 lg:px-6">
        {TILES.map((t, i) => (
          <Reveal key={t.href} delay={i * 90}>
            <Link
              href={t.href}
              className={cn(
                "group/tile relative flex min-h-100 flex-col justify-between overflow-hidden p-9 outline-offset-[-4px]",
                t.light ? "bg-paper text-ink" : i === 0 ? "bg-[#141414] text-white" : "bg-[#1b1b1b] text-white",
              )}
            >
              <span aria-hidden="true" className={cn("display pointer-events-none absolute -top-4 right-4 text-[150px] leading-none", t.light ? "stroke-ghost" : "text-outline")}>
                {t.index}
              </span>
              <div className="relative z-10 flex max-w-[64%] flex-col items-start gap-3">
                <Sticker tone={t.light ? "dark" : "light"} rotate={i % 2 ? 3 : -3}>
                  {t.sticker}
                </Sticker>
                <h2 className="display mt-2 text-[clamp(52px,4.6vw,64px)] whitespace-nowrap">
                  {t.title.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <p className={cn("text-[15px] leading-normal", t.light ? "text-[#4a4a4a]" : "text-[#bdbdbd]")}>{t.sub}</p>
              </div>
              <span className="relative z-10 inline-flex items-center gap-3 text-[13px] font-semibold tracking-[0.14em] uppercase">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 group-hover/tile:rotate-45",
                    t.light ? "border-ink group-hover/tile:bg-ink group-hover/tile:text-white" : "border-white group-hover/tile:bg-white group-hover/tile:text-ink",
                  )}
                >
                  <ArrowUpRightIcon className="size-4.5" />
                </span>
                {t.cta}
              </span>
              <GarmentArt
                {...t.art}
                shadow={false}
                className="absolute -right-[8%] -bottom-[8%] w-[66%] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.06] group-hover/tile:-rotate-3"
              />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
