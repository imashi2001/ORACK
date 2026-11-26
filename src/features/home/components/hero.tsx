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
      className="relative isolate flex min-h-[clamp(560px,calc(100svh-104px),940px)] overflow-hidden bg-ink text-white"
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
                className={cn("object-cover", i === current && "hero-zoom")}
                style={{ objectPosition: s.focus }}
              />
            </div>
          ))}
          {/* Keep the type readable on any photo, darkest where the text sits. */}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.55)_32%,rgba(10,10,10,0.08)_62%,rgba(10,10,10,0.35)_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(10,10,10,0.55)_0%,transparent_55%)] md:block" />
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

      <Container className="flex w-full flex-col justify-end gap-8 pt-24 pb-28">
        <h1 className="street text-[clamp(64px,12.5vw,208px)]">
          <span className="animate-in fade-in slide-in-from-bottom-6 block duration-700">Live bold.</span>
          <span className="stroke-light animate-in fade-in slide-in-from-bottom-6 block fill-mode-both delay-150 duration-700">Wear ORACK.</span>
        </h1>

        <div className="flex flex-wrap items-end justify-between gap-6">
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
