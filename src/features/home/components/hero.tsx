"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { Container } from "@/components/shop/container";
import { GarmentArt } from "@/features/products/components/garment-art";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    name: "Essentials",
    eyebrow: "Drop 01 / Essentials",
    lines: ["Wear your", "identity."],
    sub: "Oversized fits, clean lines and a monochrome palette made to go with everything. Discover your style. Make it yours.",
    primary: { label: "Shop now", href: "/products" },
    secondary: { label: "Customize", href: "/customize" },
    tag: { label: "Signature Logo Tee", price: "Rs. 2,700", href: "/products/signature-logo-tee" },
  },
  {
    name: "Hoodies",
    eyebrow: "Drop 01 / Hoodies",
    lines: ["Built for", "the street."],
    sub: "A relaxed cut with room to layer. Premium comfort, street-ready, in black, white, ash and charcoal.",
    primary: { label: "Shop hoodies", href: "/products?category=hoodies" },
    secondary: { label: "New arrivals", href: "/products?sort=newest" },
    tag: { label: "Minimal Hoodie", price: "Rs. 4,700", href: "/products/minimal-hoodie" },
  },
  {
    name: "Custom",
    eyebrow: "Custom studio",
    lines: ["Your design.", "Our craft."],
    sub: "Send us your idea, choose the placement and get a quote on WhatsApp. Nothing is printed until you approve it.",
    primary: { label: "Start customizing", href: "/customize" },
    secondary: { label: "How it works", href: "/#how-it-works" },
    tag: null,
  },
] as const;

const INTERVAL_MS = 7000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const slide = SLIDES[index];

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoplay]);

  return (
    <section aria-roledescription="carousel" aria-label="Featured drop" className="relative overflow-hidden bg-ink text-white">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-[0.09]">
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>
      <div aria-hidden="true" className="display text-outline pointer-events-none absolute -right-[2vw] -bottom-[4vw] text-[clamp(180px,30vw,460px)] whitespace-nowrap">
        ORACK.
      </div>

      <Container className="relative grid min-h-[clamp(600px,84vh,780px)] grid-cols-[repeat(auto-fit,minmax(min(100%,480px),1fr))] items-center gap-10 pt-[clamp(40px,6vw,72px)] pb-10">
        <div className="relative z-10 flex flex-col gap-7" aria-live={autoplay ? "off" : "polite"}>
          <div className="eyebrow flex items-center gap-3.5 text-xs text-[#bdbdbd]">
            <span className="h-[1.5px] w-9 bg-white" aria-hidden="true" />
            {slide.eyebrow}
          </div>
          <h1 className="display text-[clamp(68px,10.5vw,164px)]">
            <span className="block">{slide.lines[0]}</span>
            <span className="block">{slide.lines[1]}</span>
          </h1>
          <p className="max-w-[460px] text-lg leading-relaxed text-[#c9c9c9]">{slide.sub}</p>
          <div className="flex flex-wrap gap-3.5">
            <Link href={slide.primary.href} className={cta({ tone: "light" })}>
              {slide.primary.label} <ArrowRightIcon className="arrow" />
            </Link>
            <Link href={slide.secondary.href} className={cta({ tone: "outline-light" })}>
              {slide.secondary.label} <ArrowRightIcon className="arrow" />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4.5" role="group" aria-label="Choose slide">
            {SLIDES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                aria-label={`Show slide ${i + 1}: ${s.name}`}
                aria-current={i === index}
                onClick={() => {
                  setIndex(i);
                  setAutoplay(false);
                }}
                className="flex min-w-24 flex-col gap-2.5 py-2 text-left"
              >
                <span className={cn("block h-0.5 w-24", i === index ? "bg-white" : "bg-[#3a3a3a]")} />
                <span className={cn("eyebrow", i === index ? "text-white" : "text-[#8f8f8f]")}>
                  0{i + 1} {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-[640px] justify-self-center">
          <div aria-hidden="true" className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#5a5a58_0%,#2a2a29_42%,rgba(10,10,10,0)_70%)]" />
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[10%] h-px bg-[linear-gradient(90deg,transparent,#3a3a3a,transparent)]" />
          {index === 0 && (
            <>
              <GarmentArt kind="tee" tone="black" print="chest" shadow={false} className="absolute top-[10%] left-0 w-[62%] -rotate-6 drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
              <GarmentArt kind="tee" tone="white" print="back" shadow={false} className="absolute top-[18%] right-0 w-[62%] rotate-[5deg] drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
            </>
          )}
          {index === 1 && (
            <>
              <GarmentArt kind="hoodie" tone="charcoal" print="chest" shadow={false} className="absolute top-[8%] left-0 w-[62%] -rotate-[5deg] drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
              <GarmentArt kind="hoodie" tone="white" print="chest" shadow={false} className="absolute top-[16%] right-0 w-[64%] rotate-[4deg] drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
            </>
          )}
          {index === 2 && (
            <>
              <GarmentArt kind="tee" tone="charcoal" print="graphic" shadow={false} className="absolute top-[10%] left-[12%] w-[76%] drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
              <div aria-hidden="true" className="absolute top-[22%] left-[30%] h-[34%] w-[40%]">
                <span className="absolute top-0 left-0 size-5.5 border-t-2 border-l-2 border-white" />
                <span className="absolute top-0 right-0 size-5.5 border-t-2 border-r-2 border-white" />
                <span className="absolute bottom-0 left-0 size-5.5 border-b-2 border-l-2 border-white" />
                <span className="absolute right-0 bottom-0 size-5.5 border-r-2 border-b-2 border-white" />
              </div>
              <span className="eyebrow absolute top-[6%] right-[2%] border border-white/20 bg-white/8 px-3.5 py-2.5">Print area · Front</span>
            </>
          )}
          {slide.tag && (
            <Link href={slide.tag.href} className="eyebrow absolute top-[6%] right-[2%] flex flex-col gap-1 border border-white/20 bg-white/8 px-3.5 py-2.5 backdrop-blur-sm hover:bg-white/15">
              <span className="text-[#bdbdbd]">{slide.tag.label}</span>
              <span className="text-[13px] text-white">{slide.tag.price}</span>
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
