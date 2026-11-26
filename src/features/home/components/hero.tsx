"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Container } from "@/components/shop/container";
import { cta } from "@/components/shop/cta";
import type { HeroSlideView } from "@/features/hero/queries";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6500;

/**
 * Full-bleed photo hero. Photos come from Admin → Homepage; until one is uploaded a
 * plain black version with the outlined monogram is shown. Text is kept to the slogan
 * and two actions so the photography does the talking.
 */
export function Hero({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;
  const current = count ? index % count : 0;
  const running = count > 1 && playing && !hovered && !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [running, current, count]);

  return (
    <section
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label="Live Bold. Wear ORACK"
      // data-hero lets the header go transparent over this section; -mt-18 slides the photo up under it.
      data-hero=""
      className="relative isolate -mt-18 flex min-h-[clamp(620px,calc(100svh-36px),1000px)] overflow-hidden bg-ink text-white"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {count > 0 ? (
        <div className="absolute inset-0 -z-10">
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-out", i === current ? "opacity-100" : "opacity-0")}
            >
              <Image
                // Restart the push-in each time the slide comes back.
                key={i === current ? `${s.id}-${index}` : s.id}
                src={s.url}
                alt={s.altText}
                fill
                sizes="100vw"
                quality={75}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className={cn("object-cover", s.monochrome && "grayscale", i === current && "hero-zoom")}
                style={{ objectPosition: s.focus }}
              />
            </div>
          ))}
          {/* Shade only where it's needed: under the header and behind the bottom-left type, so the photo stays clear. */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[34%] bg-[linear-gradient(to_bottom,rgba(10,10,10,0.72)_0%,rgba(10,10,10,0.35)_45%,transparent_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.9)_0%,rgba(10,10,10,0.55)_30%,transparent_62%)] md:bg-[linear-gradient(to_top,rgba(10,10,10,0.8)_0%,rgba(10,10,10,0.35)_28%,transparent_50%)]" />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-[radial-gradient(ellipse_62%_75%_at_8%_100%,rgba(10,10,10,0.82)_0%,rgba(10,10,10,0.5)_45%,transparent_80%)] md:block" />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,#2b2b2a_0%,#0a0a0a_65%)]" />
          <div className="absolute top-1/2 right-[-8vw] w-[min(78vw,980px)] -translate-y-1/2 text-white/[0.08]">
            <LogoMark outline />
          </div>
        </div>
      )}
      {/* Film grain */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.07] mix-blend-overlay">
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>

      <Container className="flex w-full flex-col justify-end gap-7 pt-36 pb-28 sm:pb-24">
        <div className="flex flex-col gap-4">
          <p className="eyebrow animate-in fade-in flex items-center gap-3 text-white/80 duration-700">
            <span aria-hidden="true" className="h-px w-8 bg-white/70" />
            Streetwear
          </p>
          <h1 className="street text-[clamp(50px,5.4vw,100px)] [text-shadow:0_2px_28px_rgba(0,0,0,0.35)]">
            <span className="animate-in fade-in slide-in-from-bottom-4 block duration-700">Live bold.</span>
            {/* Outlined type reads well on plain black but gets lost on a busy photo. */}
            <span className={cn("animate-in fade-in slide-in-from-bottom-4 block fill-mode-both delay-150 duration-700", count === 0 && "stroke-light")}>Wear ORACK.</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="animate-in fade-in grid w-full grid-cols-2 gap-3 fill-mode-both delay-300 duration-700 sm:flex sm:w-auto">
            <Link href="/products" className={cn(cta({ tone: "light" }), "justify-center px-4")}>
              Shop now <ArrowRightIcon className="arrow" />
            </Link>
            <Link href="/customize" className={cn(cta({ tone: "outline-light" }), "justify-center px-4")}>
              Customize <ArrowRightIcon className="arrow" />
            </Link>
          </div>

          {count > 1 && (
            <div className="flex items-center gap-4">
              <div role="group" aria-label="Choose image" className="flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Show image ${i + 1} of ${count}`}
                    aria-current={i === current}
                    onClick={() => {
                      setIndex(i);
                      setPlaying(false);
                    }}
                    className="group/dot py-3"
                  >
                    <span className={cn("relative block h-0.5 overflow-hidden bg-white/30 transition-[width] duration-300", i === current ? "w-14" : "w-6 group-hover/dot:bg-white/60")}>
                      {i === current && (
                        <span
                          key={`${index}-${running}`}
                          className={cn("absolute inset-0 origin-left bg-white", running && "animate-progress")}
                          style={running ? { animationDuration: `${INTERVAL_MS}ms` } : undefined}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <span className="eyebrow tabular-nums text-white/70">
                {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                className="flex size-10 items-center justify-center rounded-full border border-white/30 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
