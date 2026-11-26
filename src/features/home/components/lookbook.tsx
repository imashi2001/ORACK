import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Container } from "@/components/shop/container";
import { Reveal } from "@/components/shop/reveal";
import { SectionHeading, SpinBadge, Tape } from "@/components/shop/street";
import { ProductVisual } from "@/features/products/components/product-visual";
import type { Product } from "@/features/products/types";
import { cn } from "@/lib/utils";

// Asymmetric collage: each slot has its own size, rotation and backdrop.
const SLOTS = [
  { cls: "md:col-span-7 md:row-span-2 min-h-[420px] md:min-h-[640px] bg-[#161616]", rotate: -2, dark: true, tape: "left-8 -top-2" },
  { cls: "md:col-span-5 min-h-[320px] bg-mist", rotate: 3, dark: false, tape: "right-10 -top-2" },
  { cls: "md:col-span-5 min-h-[320px] bg-[#2a2a29]", rotate: -3, dark: true, tape: "left-1/3 -top-2" },
  { cls: "md:col-span-4 min-h-[340px] bg-white", rotate: 2, dark: false, tape: "left-6 -top-2" },
  { cls: "md:col-span-8 min-h-[340px] bg-ink", rotate: -1, dark: true, tape: "right-1/4 -top-2" },
];

export function Lookbook({ products }: { products: Product[] }) {
  const picks = products.slice(0, SLOTS.length);
  if (picks.length < 3) return null;

  return (
    <section aria-labelledby="lookbook-heading" className="relative overflow-hidden bg-paper py-[clamp(72px,9vw,128px)]">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="lookbook-heading" index="[03]" eyebrow="Lookbook" title="On the streets" ghost="STREET" note="fresh off the rack ↓" />
          <p className="max-w-sm text-[15px] leading-relaxed text-graphite">Pieces from the current drop, styled the way they&apos;re meant to be worn. Tap any look to shop it.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-5 md:auto-rows-[minmax(300px,auto)] md:grid-cols-12">
          <SpinBadge id="lookbook" dark text="shop the look • shop the look • " className="-top-10 right-2 z-20 hidden md:block" />
          {picks.map((p, i) => {
            const slot = SLOTS[i];
            const colour = p.colours[Math.min(i % 2, p.colours.length - 1)];
            return (
              <Reveal key={p.id} delay={i * 80} className={cn("relative", slot.cls)}>
                <Link href={`/products/${p.slug}`} className="group/look relative flex size-full min-h-[inherit] flex-col justify-between overflow-hidden p-6">
                  <Tape onLight={!slot.dark} className={slot.tape} rotate={slot.rotate * 2} />
                  <span className={cn("eyebrow relative z-10 flex items-center justify-between", slot.dark ? "text-[#a3a3a3]" : "text-smoke")}>
                    <span>Fig. 0{i + 1}</span>
                    <span>{p.category.name}</span>
                  </span>

                  <span className="relative flex flex-1 items-center justify-center py-6">
                    <span
                      className="block w-[min(78%,420px)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover/look:scale-[1.05]"
                      style={{ transform: `rotate(${slot.rotate}deg)` }}
                    >
                      <ProductVisual product={p} colorName={colour?.name} shadow={false} className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]" />
                    </span>
                  </span>

                  <span className={cn("relative z-10 flex items-end justify-between gap-4", slot.dark ? "text-white" : "text-ink")}>
                    <span className="flex flex-col gap-1">
                      <span className="display text-3xl">{p.name}</span>
                      <span className={cn("eyebrow", slot.dark ? "text-[#a3a3a3]" : "text-smoke")}>{colour?.name}</span>
                    </span>
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 group-hover/look:rotate-45",
                        slot.dark ? "border-white group-hover/look:bg-white group-hover/look:text-ink" : "border-ink group-hover/look:bg-ink group-hover/look:text-white",
                      )}
                    >
                      <ArrowUpRightIcon className="size-5" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
