import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Reveal } from "@/components/shop/reveal";
import { Sticker } from "@/components/shop/street";
import { GarmentArt } from "@/features/products/components/garment-art";
import type { HomeCategory } from "@/features/products/queries";
import type { GarmentKind, PrintStyle, Tone } from "@/features/products/types";
import { categorySlot, type SiteImageView } from "@/features/site-images/slots";
import { cn } from "@/lib/utils";

interface Tile {
  key: string;
  sticker: string;
  title: string[];
  sub: string;
  cta: string;
  href: string;
  light: boolean;
  image?: SiteImageView;
  art: { kind: GarmentKind; tone: Tone; print: PrintStyle };
}

const DEFAULT_TAGLINE = "Essential fits for every style.";

/**
 * "Shop by" cards under the hero: one per visible category that has products, then Custom designs.
 * Hide a category in Admin → Categories and its card disappears; photos come from Admin → Homepage.
 */
export function CategoryTiles({ categories, images }: { categories: HomeCategory[]; images: Record<string, SiteImageView> }) {
  const tiles: Tile[] = [
    ...categories.map((c, i) => ({
      key: c.id,
      sticker: `${c.productCount} ${c.productCount === 1 ? "style" : "styles"}`,
      title: [c.name],
      sub: c.tagline || DEFAULT_TAGLINE,
      cta: "Shop now",
      href: `/products?category=${c.slug}`,
      light: false,
      image: images[categorySlot(c.id)],
      art: { kind: (c.slug.includes("hood") ? "hoodie" : "tee") as GarmentKind, tone: (i % 2 ? "ash" : "black") as Tone, print: "chest" as PrintStyle },
    })),
    {
      key: "custom",
      sticker: "Studio",
      title: ["Custom", "designs"],
      sub: "Your design. Our craft. Get a quote on WhatsApp.",
      cta: "Create now",
      href: "/customize",
      light: true,
      image: images["home.custom-tile"],
      art: { kind: "tee", tone: "black", print: "graphic" },
    },
  ];
  const twoUp = tiles.length <= 2;

  return (
    <section aria-label="Shop by category" className="bg-ink pb-3">
      <div className={cn("mx-auto grid max-w-[1360px] gap-3 px-3 lg:px-6", twoUp ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3")}>
        {tiles.map((t, i) => {
          const onPhoto = !!t.image;
          const dark = onPhoto || !t.light;
          return (
            <Reveal key={t.key} delay={i * 90}>
              <Link
                href={t.href}
                className={cn(
                  "group/tile relative isolate flex flex-col justify-between overflow-hidden p-7 outline-offset-[-4px] sm:p-9",
                  twoUp ? "min-h-[420px] md:min-h-[clamp(460px,40vw,560px)]" : "min-h-100",
                  dark ? "text-white" : "text-ink",
                  onPhoto ? "bg-ink" : t.light ? "bg-paper" : i % 2 ? "bg-[#1b1b1b]" : "bg-[#141414]",
                )}
              >
                {t.image ? (
                  <>
                    <Image
                      src={t.image.url}
                      alt={t.image.alt}
                      fill
                      sizes={twoUp ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
                      className="-z-10 object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.05]"
                    />
                    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(10,10,10,0.85)_0%,rgba(10,10,10,0.25)_50%,rgba(10,10,10,0.45)_100%)]" />
                  </>
                ) : (
                  <GarmentArt
                    {...t.art}
                    shadow={false}
                    className={cn(
                      "absolute -z-10 transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/tile:scale-[1.06] group-hover/tile:-rotate-3",
                      twoUp ? "-right-[4%] -bottom-[6%] w-[58%] md:w-[54%]" : "-right-[8%] -bottom-[8%] w-[66%]",
                    )}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={cn("display pointer-events-none absolute -top-4 right-4 -z-10 text-[clamp(110px,12vw,170px)] leading-none", dark ? "text-outline" : "stroke-ghost")}
                >
                  0{i + 1}
                </span>

                <div className="relative flex max-w-[70%] flex-col items-start gap-3">
                  <Sticker tone={dark ? "light" : "dark"} rotate={i % 2 ? 3 : -3}>
                    {t.sticker}
                  </Sticker>
                  <h2 className={cn("display mt-2", twoUp ? "text-[clamp(52px,6vw,88px)]" : "text-[clamp(52px,4.6vw,64px)]")}>
                    {t.title.map((line) => (
                      <span key={line} className="block whitespace-nowrap">
                        {line}
                      </span>
                    ))}
                  </h2>
                  <p className={cn("max-w-xs text-[15px] leading-normal", dark ? "text-white/75" : "text-[#4a4a4a]")}>{t.sub}</p>
                </div>

                <span className="relative inline-flex items-center gap-3 text-[13px] font-semibold tracking-[0.14em] uppercase">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 group-hover/tile:rotate-45",
                      dark ? "border-white group-hover/tile:bg-white group-hover/tile:text-ink" : "border-ink group-hover/tile:bg-ink group-hover/tile:text-white",
                    )}
                  >
                    <ArrowUpRightIcon className="size-5" />
                  </span>
                  {t.cta}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
