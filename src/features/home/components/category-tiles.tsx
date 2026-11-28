import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Reveal } from "@/components/shop/reveal";
import { SectionHeading, Sticker } from "@/components/shop/street";
import { GarmentArt } from "@/features/products/components/garment-art";
import type { HomeCategory } from "@/features/products/queries";
import { categorySlot, type SiteImageView } from "@/features/site-images/slots";
import { cn } from "@/lib/utils";

/** The homepage shows this many category cards at most; the rest are one tap away in the Shop menu. */
const MAX_CARDS = 8;

// Static class maps so Tailwind sees every class it needs.
const MD_COLS = { 2: "md:grid-cols-2", 3: "md:grid-cols-3" } as const;
const LG_COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;
const SPAN = { 1: "col-span-1", 2: "col-span-2" } as const;
const MD_SPAN = { 1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3" } as const;
const LG_SPAN = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" } as const;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A tagline that only repeats the category name ("Football T" on "Football") adds nothing, so it's left out. */
function usefulTagline(name: string, tagline: string | null): string | null {
  if (!tagline?.trim()) return null;
  const a = norm(name);
  const b = norm(tagline);
  return a.includes(b) || b.includes(a) ? null : tagline.trim();
}

/**
 * "Shop by category" under the hero: one card per visible category (up to MAX_CARDS), then the Custom designs card,
 * which stretches to fill the last row so the grid always ends square.
 * Card photo: the one uploaded in Admin → Homepage, else a photo of a product in the category, else drawn artwork.
 */
export function CategoryTiles({ categories, images }: { categories: HomeCategory[]; images: Record<string, SiteImageView> }) {
  const shown = categories.slice(0, MAX_CARDS);
  const n = shown.length;
  const lgCols = Math.min(4, Math.max(2, n + 1)) as 2 | 3 | 4;
  const mdCols = Math.min(3, lgCols) as 2 | 3;
  const fill = (cols: number) => cols - (n % cols);
  const span = { base: fill(2) as 1 | 2, md: fill(mdCols) as 1 | 2 | 3, lg: fill(lgCols) as 1 | 2 | 3 | 4 };

  return (
    <section aria-labelledby="categories-heading" className="overflow-hidden bg-ink py-[clamp(56px,7vw,104px)] text-white">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-9 px-3 sm:gap-12 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 px-1 lg:px-0">
          <SectionHeading dark id="categories-heading" index={String(categories.length).padStart(2, "0")} eyebrow="Categories" title="Shop by category." ghost="SHOP" note="pick your vibe" />
          <Link href="/products" className="inline-flex items-center gap-2 border-b-[1.5px] border-current pb-0.5 text-sm font-semibold hover:opacity-70">
            Shop all products <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>

        <ul className={cn("grid grid-cols-2 gap-2 sm:gap-3", MD_COLS[mdCols], LG_COLS[lgCols])}>
          {shown.map((c, i) => (
            <Reveal as="li" key={c.id} delay={(i % lgCols) * 80} className="min-w-0">
              <CategoryCard category={c} index={i} image={images[categorySlot(c.id)] ?? c.cover ?? undefined} cols={lgCols} />
            </Reveal>
          ))}
          <Reveal as="li" delay={(n % lgCols) * 80} className={cn("min-w-0", SPAN[span.base], MD_SPAN[span.md], LG_SPAN[span.lg])}>
            <CustomCard image={images["home.custom-tile"]} />
          </Reveal>
        </ul>
      </div>
    </section>
  );
}

function CategoryCard({ category: c, index, image, cols }: { category: HomeCategory; index: number; image?: SiteImageView; cols: number }) {
  const tagline = usefulTagline(c.name, c.tagline);
  const count = `${c.productCount} ${c.productCount === 1 ? "style" : "styles"}`;
  return (
    <Link
      href={`/products?category=${c.slug}`}
      className={cn(
        "group/tile @container relative isolate flex aspect-[3/4] h-full flex-col justify-between overflow-hidden p-3.5 outline-offset-[-4px] sm:aspect-[4/5] sm:p-5",
        cols <= 2 && "lg:aspect-auto lg:min-h-[clamp(440px,38vw,560px)]",
        index % 2 ? "bg-[#1b1b1b]" : "bg-[#141414]",
      )}
    >
      {image ? (
        <>
          <Image
            src={image.url}
            alt={image.alt || c.name}
            fill
            sizes={`(min-width: 1024px) ${Math.round(100 / cols)}vw, (min-width: 768px) 33vw, 50vw`}
            className="-z-10 object-cover grayscale-[0.85] transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.06] group-hover/tile:grayscale-0"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.35)_45%,rgba(10,10,10,0.15)_70%,rgba(10,10,10,0.5)_100%)]" />
        </>
      ) : (
        <>
          <GarmentArt
            kind={c.art.kind}
            print={c.art.print === "none" ? "chest" : c.art.print}
            tone={index % 2 ? "ash" : "black"}
            shadow={false}
            className="absolute top-[14%] left-1/2 -z-10 w-[88%] -translate-x-1/2 transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.05] group-hover/tile:-rotate-2"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.2)_45%,transparent_70%)]" />
        </>
      )}

      <div className="flex items-start justify-between gap-2">
        <span aria-hidden="true" className="display text-outline text-[clamp(34px,22cqw,92px)] leading-none">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Sticker tone="light" rotate={index % 2 ? 3 : -3} className="hidden @[200px]:inline-flex">
          {count}
        </Sticker>
      </div>

      <div className="flex flex-col gap-2 @[260px]:gap-3">
        <h3 className="street text-[clamp(24px,14cqw,64px)] leading-[0.92] text-balance break-words uppercase">{c.name}</h3>
        {tagline && <p className="hidden max-w-[34ch] text-sm leading-snug text-white/70 @[260px]:line-clamp-2">{tagline}</p>}
        <span className="mt-1 flex items-center justify-between gap-3 border-t border-white/20 pt-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase @[260px]:pt-3.5 @[260px]:text-xs">
          <span className="@[200px]:hidden">{count}</span>
          <span className="hidden @[200px]:inline">Shop now</span>
          <span className="flex size-8 items-center justify-center rounded-full border-[1.5px] border-white transition-all duration-300 group-hover/tile:rotate-45 group-hover/tile:bg-white group-hover/tile:text-ink @[260px]:size-10">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Light card that stands out from the dark grid. Lays out side by side when it spans a wide row. */
function CustomCard({ image }: { image?: SiteImageView }) {
  return (
    <Link href="/customize" className="group/tile @container relative isolate flex h-full min-h-[300px] overflow-hidden bg-paper text-ink outline-offset-[-4px]">
      <div className="flex w-full flex-col @[560px]:flex-row">
        <div className="relative z-10 flex flex-1 flex-col justify-between gap-6 p-5 sm:p-7 @[560px]:p-9">
          <div className="flex flex-col items-start gap-3">
            <Sticker tone="dark" rotate={-3}>
              Studio
            </Sticker>
            <h3 className="display mt-1 text-[clamp(34px,12cqw,72px)] @[560px]:text-[clamp(44px,7cqw,80px)]">
              <span className="block">Custom</span>
              <span className="block">designs</span>
            </h3>
            <p className="max-w-[30ch] text-[15px] leading-normal text-[#4a4a4a]">Your design. Our craft. Send your idea and get a quote on WhatsApp.</p>
          </div>
          <span className="inline-flex items-center gap-3 text-[12px] font-semibold tracking-[0.14em] uppercase sm:text-[13px]">
            <span className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-ink transition-all duration-300 group-hover/tile:rotate-45 group-hover/tile:bg-ink group-hover/tile:text-white">
              <ArrowUpRightIcon className="size-5" />
            </span>
            Create now
          </span>
        </div>

        <div className="relative h-[210px] overflow-hidden @[560px]:h-auto @[560px]:flex-1">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.05]"
            />
          ) : (
            <GarmentArt
              kind="tee"
              tone="black"
              print="graphic"
              shadow={false}
              className="absolute top-3 left-1/2 w-[min(64%,260px)] -translate-x-1/2 @[560px]:top-auto @[560px]:-bottom-[10%] @[560px]:w-[min(80%,360px)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.05] group-hover/tile:-rotate-3"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
