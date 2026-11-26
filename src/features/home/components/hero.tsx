"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { Container } from "@/components/shop/container";
import { SpinBadge, Sticker, Tape } from "@/components/shop/street";
import { GarmentArt } from "@/features/products/components/garment-art";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    name: "Essentials",
    eyebrow: "Drop 01 / Essentials",
    lines: ["Wear your", "identity."],
    note: "made to stand out",
    sub: "Oversized fits, clean lines and a monochrome palette made to go with everything. Discover your style. Make it yours.",
    primary: { label: "Shop now", href: "/products" },
    secondary: { label: "Customize", href: "/customize" },
    tag: { label: "Signature Logo Tee", href: "/products/signature-logo-tee" },
  },
  {
    name: "Hoodies",
    eyebrow: "Drop 01 / Hoodies",
    lines: ["Built for", "the street."],
    note: "layer up",
    sub: "A relaxed cut with room to layer. Premium comfort, street-ready, in black, white, ash and charcoal.",
    primary: { label: "Shop hoodies", href: "/products?category=hoodies" },
    secondary: { label: "New arrivals", href: "/products?sort=newest" },
    tag: { label: "Minimal Hoodie", href: "/products/minimal-hoodie" },
  },
  {
    name: "Custom",
    eyebrow: "Custom studio",
    lines: ["Your design.", "Our craft."],
    note: "your idea, printed",
    sub: "Send us your idea, choose the placement and get a quote on WhatsApp. Nothing is printed until you approve it.",
    primary: { label: "Start customizing", href: "/customize" },
    secondary: { label: "How it works", href: "/#how-it-works" },
    tag: null,
  },
] as const;

const INTERVAL_MS = 7000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);
  const slide = SLIDES[index];
  const running = playing && !hovered && !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [running, index]);

  // Subtle parallax on the artwork, desktop pointers only.
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !artRef.current) return;
    const r = artRef.current.getBoundingClientRect();
    artRef.current.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    artRef.current.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };

  const layer = (depth: number) => ({ transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0)` });

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured drop"
      className="relative overflow-hidden bg-ink text-white"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={onPointerMove}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-[0.09]">
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>
      {/* Faint grid, like a cutting mat */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div aria-hidden="true" className="display text-outline pointer-events-none absolute -right-[2vw] -bottom-[4vw] text-[clamp(180px,30vw,460px)] whitespace-nowrap">
        ORACK.
      </div>

      <Container className="relative grid min-h-[clamp(620px,86vh,800px)] grid-cols-[repeat(auto-fit,minmax(min(100%,480px),1fr))] items-center gap-10 pt-[clamp(48px,6vw,80px)] pb-12">
        <div className="relative z-10 flex flex-col gap-7" aria-live={running ? "off" : "polite"}>
          <div className="flex flex-wrap items-center gap-4">
            <Sticker tone="light" rotate={-3}>
              ✶ {slide.eyebrow}
            </Sticker>
            <span className="eyebrow text-[#8f8f8f]">Colombo · Sri Lanka</span>
          </div>

          <h1 key={index} className="display animate-in fade-in slide-in-from-bottom-4 text-[clamp(68px,10.5vw,168px)] duration-500">
            <span className="block">{slide.lines[0]}</span>
            <span className="stroke-light block">{slide.lines[1]}</span>
          </h1>
          <span aria-hidden="true" className="marker -mt-4 -rotate-3 text-2xl text-[#d4d4d4]">
            ↳ {slide.note}
          </span>

          <p className="max-w-[460px] text-lg leading-relaxed text-[#c9c9c9]">{slide.sub}</p>
          <div className="flex flex-wrap gap-3.5">
            <Link href={slide.primary.href} className={cta({ tone: "light" })}>
              {slide.primary.label} <ArrowRightIcon className="arrow" />
            </Link>
            <Link href={slide.secondary.href} className={cta({ tone: "outline-light" })}>
              {slide.secondary.label} <ArrowRightIcon className="arrow" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4.5">
            <div role="group" aria-label="Choose slide" className="flex flex-wrap gap-4.5">
              {SLIDES.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  aria-label={`Show slide ${i + 1}: ${s.name}`}
                  aria-current={i === index}
                  onClick={() => {
                    setIndex(i);
                    setPlaying(false);
                  }}
                  className="group/dot flex min-w-24 flex-col gap-2.5 py-2 text-left"
                >
                  <span className="relative block h-0.5 w-24 overflow-hidden bg-[#3a3a3a]">
                    {i === index && (
                      <span
                        key={`${index}-${running}`}
                        className={cn("absolute inset-0 origin-left bg-white", running ? "animate-progress" : "")}
                        style={running ? { animationDuration: `${INTERVAL_MS}ms` } : undefined}
                      />
                    )}
                  </span>
                  <span className={cn("eyebrow transition-colors", i === index ? "text-white" : "text-[#8f8f8f] group-hover/dot:text-white")}>
                    0{i + 1} {s.name}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              className="flex size-10 items-center justify-center rounded-full border border-[#3a3a3a] text-[#bdbdbd] transition-colors hover:border-white hover:text-white"
            >
              {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
            </button>
          </div>
        </div>

        <div ref={artRef} className="relative aspect-square w-full max-w-[640px] justify-self-center">
          <div aria-hidden="true" className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#5a5a58_0%,#2a2a29_42%,rgba(10,10,10,0)_70%)]" />
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[10%] h-px bg-[linear-gradient(90deg,transparent,#3a3a3a,transparent)]" />
          <SpinBadge id="hero" text="ORACK • streetwear • sri lanka • drop 01 • " className="-top-2 left-[2%] z-20 hidden sm:block" />

          <div key={index} className="animate-in fade-in zoom-in-95 absolute inset-0 duration-700">
            {index === 0 && (
              <>
                <div className="absolute top-[10%] left-0 w-[62%] -rotate-6 transition-transform duration-300 ease-out" style={layer(-18)}>
                  <GarmentArt kind="tee" tone="black" print="chest" shadow={false} className="w-full drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
                </div>
                <div className="absolute top-[18%] right-0 w-[62%] rotate-[5deg] transition-transform duration-300 ease-out" style={layer(26)}>
                  <Tape className="-top-1 left-[38%]" rotate={-6} />
                  <GarmentArt kind="tee" tone="white" print="back" shadow={false} className="w-full drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
                </div>
              </>
            )}
            {index === 1 && (
              <>
                <div className="absolute top-[8%] left-0 w-[62%] -rotate-[5deg] transition-transform duration-300 ease-out" style={layer(-18)}>
                  <GarmentArt kind="hoodie" tone="charcoal" print="chest" shadow={false} className="w-full drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
                </div>
                <div className="absolute top-[16%] right-0 w-[64%] rotate-[4deg] transition-transform duration-300 ease-out" style={layer(26)}>
                  <Tape className="top-0 left-[34%]" rotate={5} />
                  <GarmentArt kind="hoodie" tone="white" print="chest" shadow={false} className="w-full drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
                </div>
              </>
            )}
            {index === 2 && (
              <>
                <div className="absolute top-[10%] left-[12%] w-[76%] transition-transform duration-300 ease-out" style={layer(18)}>
                  <GarmentArt kind="tee" tone="charcoal" print="graphic" shadow={false} className="w-full drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" />
                </div>
                <div aria-hidden="true" className="absolute top-[22%] left-[30%] h-[34%] w-[40%]">
                  <span className="absolute top-0 left-0 size-5.5 border-t-2 border-l-2 border-white" />
                  <span className="absolute top-0 right-0 size-5.5 border-t-2 border-r-2 border-white" />
                  <span className="absolute bottom-0 left-0 size-5.5 border-b-2 border-l-2 border-white" />
                  <span className="absolute right-0 bottom-0 size-5.5 border-r-2 border-b-2 border-white" />
                </div>
                <span aria-hidden="true" className="marker absolute right-[4%] bottom-[16%] rotate-[-8deg] text-xl text-white">
                  your art here →
                </span>
              </>
            )}
          </div>

          {slide.tag ? (
            <Link
              href={slide.tag.href}
              className="group/tag absolute top-[8%] right-[2%] z-20 flex rotate-3 flex-col gap-1 bg-white px-3.5 py-2.5 text-ink shadow-[4px_4px_0_rgba(255,255,255,0.18)] transition-transform hover:rotate-0"
            >
              <span className="eyebrow text-smoke">Shop the look</span>
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                {slide.tag.label} <ArrowRightIcon className="size-3.5 transition-transform group-hover/tag:translate-x-1" />
              </span>
            </Link>
          ) : (
            <span className="eyebrow absolute top-[8%] right-[2%] z-20 border border-white/25 bg-white/8 px-3.5 py-2.5">Print area · Front</span>
          )}
        </div>
      </Container>
    </section>
  );
}
