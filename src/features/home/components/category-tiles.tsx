import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { GarmentArt } from "@/features/products/components/garment-art";
import type { GarmentKind, PrintStyle, Tone } from "@/features/products/types";
import { cn } from "@/lib/utils";

const TILES: { index: string; eyebrow: string; title: string[]; sub: string; cta: string; href: string; light?: boolean; art: { kind: GarmentKind; tone: Tone; print: PrintStyle } }[] = [
  { index: "01", eyebrow: "Category", title: ["T-Shirts"], sub: "Essential fits for every style.", cta: "Explore", href: "/products?category=t-shirts", art: { kind: "tee", tone: "black", print: "chest" } },
  { index: "02", eyebrow: "Category", title: ["Hoodies"], sub: "Premium comfort. Street-ready.", cta: "Explore", href: "/products?category=hoodies", art: { kind: "hoodie", tone: "ash", print: "chest" } },
  { index: "03", eyebrow: "Studio", title: ["Custom", "Designs"], sub: "Your design. Our craft.", cta: "Create now", href: "/customize", light: true, art: { kind: "tee", tone: "black", print: "graphic" } },
];

export function CategoryTiles() {
  return (
    <section aria-label="Shop by category" className="bg-ink pt-3">
      <div className="mx-auto grid max-w-[1360px] grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3 px-3 lg:px-6">
        {TILES.map((t, i) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "group/tile relative flex min-h-95 flex-col justify-between overflow-hidden p-9",
              t.light ? "bg-paper text-ink" : i === 0 ? "bg-[#141414] text-white" : "bg-[#1b1b1b] text-white",
            )}
          >
            <div className="relative z-10 flex max-w-[55%] flex-col gap-3">
              <span className={cn("eyebrow", t.light ? "text-smoke" : "text-[#8f8f8f]")}>
                {t.index} / {t.eyebrow}
              </span>
              <h2 className="display text-[64px]">
                {t.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className={cn("text-[15px] leading-normal", t.light ? "text-[#4a4a4a]" : "text-[#bdbdbd]")}>{t.sub}</p>
            </div>
            <span className="eyebrow relative z-10 inline-flex items-center gap-2.5 text-[13px] font-medium">
              {t.cta} <ArrowRightIcon className="size-4 transition-transform group-hover/tile:translate-x-1.5" />
            </span>
            <GarmentArt
              {...t.art}
              shadow={false}
              className="absolute -right-[8%] -bottom-[8%] w-[66%] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.06] group-hover/tile:-rotate-3"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
