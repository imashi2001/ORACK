import Link from "next/link";
import { ArrowRightIcon, LayersIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { Container } from "@/components/shop/container";
import { WhatsAppIcon } from "@/components/shop/icons";
import { Reveal } from "@/components/shop/reveal";
import { SectionHeading } from "@/components/shop/street";
import { LogoMark, LogoStacked } from "@/components/brand/logo";

const ORDER_STEPS = [
  { title: "Add to bag", body: "Pick your size and colour. Stock is checked live." },
  { title: "Place your order", body: "Add your name, number and address. You get an order reference instantly." },
  { title: "Send it on WhatsApp", body: "We open the chat with your order already written. Just tap send." },
  { title: "We confirm & deliver", body: "We confirm it with you, pack it, and ship it islandwide." },
];

export function HowOrdering() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24 overflow-hidden border-t border-[#e0e0dd] bg-paper py-[clamp(64px,8vw,112px)]">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="how-heading" index="[05]" eyebrow="No card. No account." title="Ordering, simplified." ghost="HOW TO" />
          <p className="max-w-[420px] leading-relaxed text-[#4a4a4a]">
            Place your order here, then confirm it with us in a quick WhatsApp chat. Payment and delivery details are agreed in that chat.
          </p>
        </div>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border-t-2 border-ink">
          {ORDER_STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="group/step flex flex-col gap-3.5 pt-7 pr-7 pb-2">
              <span className="display stroke-dark text-[72px] transition-colors duration-300 group-hover/step:text-ink">0{i + 1}</span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#4a4a4a]">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const PROPS = [
  { icon: TruckIcon, title: "Islandwide delivery", body: "Get your order anywhere in Sri Lanka." },
  { icon: ShieldCheckIcon, title: "Quality guaranteed", body: "Premium materials, lasting comfort." },
  { icon: LayersIcon, title: "Custom designs", body: "Your style, your design, your ORACK." },
  { icon: WhatsAppIcon, title: "Real people, real chat", body: "Every order is confirmed by our team on WhatsApp." },
];

export function ValueProps() {
  return (
    <section aria-label="Why ORACK" className="border-y border-[#e0e0dd] bg-white">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-8 py-10">
        {PROPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-4">
            <Icon className="size-8 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <div className="text-sm font-bold tracking-[0.06em] uppercase">{title}</div>
              <div className="mt-1.5 text-sm text-[#4a4a4a]">{body}</div>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

export function Story() {
  return (
    <section id="story" aria-labelledby="story-heading" className="scroll-mt-24 overflow-hidden bg-ink text-white">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-center gap-[clamp(40px,6vw,88px)] py-[clamp(64px,8vw,112px)]">
        <div aria-hidden="true" className="relative aspect-[5/4] overflow-hidden bg-[linear-gradient(160deg,#2b2b2a_0%,#121212_70%)]">
          {/* Faint pattern of outlined marks, with the stacked logo on top. */}
          <div className="absolute inset-0 grid grid-cols-4 place-items-center gap-6 p-6 text-white/[0.07]">
            {Array.from({ length: 12 }, (_, k) => (
              <LogoMark key={k} outline className={k % 2 ? "w-3/5" : "w-4/5"} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoStacked className="text-[clamp(56px,7vw,96px)] text-white" />
          </div>
          <span className="eyebrow absolute bottom-4.5 left-5 text-[#8f8f8f]">Est. Sri Lanka</span>
        </div>
        <div className="flex flex-col gap-6">
          <SectionHeading dark id="story-heading" index="[06]" eyebrow="About us" title="The ORACK story." ghost="ORACK" note="wear it loud" />
          <p className="max-w-[540px] text-lg leading-relaxed text-[#c9c9c9]">
            A streetwear brand built for self-expression. ORACK blends minimal design, premium quality and custom creativity to help you wear your identity, your way.
          </p>
          <div>
            <Link href="/products" className={cta({ tone: "outline-light" })}>
              Shop the drop <ArrowRightIcon className="arrow" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
