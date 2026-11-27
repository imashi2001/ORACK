"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { Container } from "@/components/shop/container";
import { GarmentArt } from "@/features/products/components/garment-art";
import type { PrintStyle } from "@/features/products/types";
import { SectionHeading, Sticker, Tape } from "@/components/shop/street";
import type { SiteImageView } from "@/features/site-images/slots";
import { cn } from "@/lib/utils";

const PLACES: { id: string; label: string; print: PrintStyle }[] = [
  { id: "front", label: "Front", print: "graphic" },
  { id: "back", label: "Back", print: "back" },
  { id: "sleeve", label: "Sleeve", print: "sleeve" },
];

const STEPS = [
  {
    title: "Choose your blank",
    body: "Pick the piece, colour, size and quantity.",
  },
  {
    title: "Describe it, upload references",
    body: "Your images stay private — only our team can see them.",
  },
  {
    title: "Get your quote on WhatsApp",
    body: "We review the request and send pricing to you directly.",
  },
  {
    title: "Approve, and we print",
    body: "Nothing goes into production until you confirm.",
  },
];

export function CustomizeBand({ image }: { image?: SiteImageView }) {
  const [place, setPlace] = useState(PLACES[0]);

  return (
    <section aria-labelledby="customize-heading" className="overflow-hidden bg-ink text-white">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-center gap-[clamp(40px,6vw,88px)] py-[clamp(64px,8vw,112px)]">
        {image ? (
          <div className="relative aspect-square overflow-hidden bg-[#131313]">
            <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <Tape className="-top-3 left-[40%]" rotate={-4} />
            <span className="absolute top-5 left-5">
              <Sticker tone="light" rotate={-3}>
                Made by you
              </Sticker>
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="relative flex aspect-square items-center justify-center bg-[#131313] bg-[linear-gradient(#1e1e1e_1px,transparent_1px),linear-gradient(90deg,#1e1e1e_1px,transparent_1px)] bg-[size:40px_40px] p-[10%]">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(120,120,118,0.45),rgba(19,19,19,0)_60%)]" />
              <GarmentArt kind="tee" tone="charcoal" print={place.print} shadow={false} className="relative w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
              <Tape className="-top-3 left-[40%]" rotate={-4} />
              <span className="absolute top-5 left-5">
                <Sticker tone="light" rotate={-3}>
                  Live preview
                </Sticker>
              </span>
              <span className="eyebrow absolute top-5 right-5" aria-live="polite">
                Placement · {place.label}
              </span>
            </div>
            <div role="group" aria-label="Print placement" className="flex flex-wrap gap-2">
              {PLACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={place.id === p.id}
                  onClick={() => setPlace(p)}
                  className={cn(
                    "h-10 border-[1.5px] px-4.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                    place.id === p.id ? "border-white bg-white text-ink" : "border-[#4a4a4a] hover:border-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-7">
          <SectionHeading
            dark
            id="customize-heading"
            index="[02]"
            eyebrow="Custom studio"
            ghost="STUDIO"
            note="upload your own art"
            title={
              <>
                Customize
                <br />
                your T-shirt.
              </>
            }
          />
          <p className="max-w-[520px] text-lg leading-relaxed text-[#c9c9c9]">
            Bring your ideas to life. Choose the colour, size and placement, upload your own design, and we&apos;ll come back with a quote.
          </p>
          <ol className="flex flex-col border-t border-[#262626]">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-5 border-b border-[#262626] py-4.5">
                <span className="eyebrow pt-1 text-xs text-[#8f8f8f]">0{i + 1}</span>
                <div>
                  <div className="text-base font-semibold">{s.title}</div>
                  <div className="mt-1 text-sm text-[#a3a3a3]">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <Link href="/customize" className={cta({ tone: "light" })}>
              Start customizing <ArrowRightIcon className="arrow" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
