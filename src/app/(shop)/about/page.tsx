import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, LayersIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { LogoMark, LogoStacked } from "@/components/brand/logo";
import { Container } from "@/components/shop/container";
import { cta } from "@/components/shop/cta";
import { PageHero } from "@/components/shop/info-page";
import { Reveal } from "@/components/shop/reveal";
import { getSiteImages } from "@/features/site-images/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description: "ORACK is black-and-white streetwear built for self-expression. Live Bold. Wear ORACK.",
};

const VALUES = [
  {
    icon: SparklesIcon,
    title: "Minimal by design",
    body: "Black, white and the greys between. Clean lines and oversized fits that go with everything you own.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Made to last",
    body: "Comfortable fabrics and prints that are checked before anything leaves us.",
  },
  {
    icon: LayersIcon,
    title: "Yours to customise",
    body: "Bring your own idea. We print it for you, and nothing is made until you approve the quote.",
  },
];

export default async function AboutPage() {
  const story = (await getSiteImages())["home.story"];
  return (
    <>
      <PageHero
        crumb="About"
        eyebrow="About ORACK"
        ghost="ORACK"
        title={
          <>
            Live bold.
            <br />
            Wear ORACK.
          </>
        }
        intro="ORACK is a streetwear label built for self-expression: minimal black-and-white pieces, everyday comfort and custom prints for people who don't blend in."
      />

      <section className="bg-paper">
        <Container className="grid items-center gap-[clamp(40px,6vw,88px)] py-[clamp(56px,8vw,112px)] lg:grid-cols-2">
          {story ? (
            <div className="relative aspect-[5/4] overflow-hidden bg-ink">
              <Image src={story.url} alt={story.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div aria-hidden="true" className="relative aspect-[5/4] overflow-hidden bg-[linear-gradient(160deg,#2b2b2a_0%,#121212_70%)]">
              <div className="absolute inset-0 grid grid-cols-4 place-items-center gap-6 p-6 text-white/[0.07]">
                {Array.from({ length: 12 }, (_, k) => (
                  <LogoMark key={k} outline className={k % 2 ? "w-3/5" : "w-4/5"} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <LogoStacked className="text-[clamp(56px,7vw,96px)] text-white" />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-5 text-lg leading-relaxed text-[#3d3d3d]">
            <h2 className="display text-[clamp(36px,4.5vw,60px)] text-ink">Our story</h2>
            <p>
              ORACK started with a simple idea: clothes should say something about the person wearing them. We keep the palette to black and white so the fit, the print and the attitude do the
              talking.
            </p>
            <p>
              Every piece is designed to be worn hard: on the street, at the shoot, everywhere in between. And when the drop doesn&apos;t have what you&apos;re picturing, our custom studio prints your
              own design.
            </p>
            <p>We keep buying simple too. No accounts, no card details: place your order here and confirm it with a real person on WhatsApp.</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="values-title" className="border-y border-line bg-white">
        <Container className="flex flex-col gap-10 py-[clamp(56px,8vw,96px)]">
          <h2 id="values-title" className="display text-[clamp(36px,4.5vw,60px)]">
            What we stand for
          </h2>
          <ul className="grid gap-px bg-line sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 90} className="flex flex-col gap-4 bg-white p-6 sm:p-8">
                <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="leading-relaxed text-graphite">{body}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-ink text-white">
        <Container className="flex flex-wrap items-end justify-between gap-8 py-[clamp(56px,8vw,96px)]">
          <h2 className="display text-[clamp(40px,6vw,88px)]">
            Find your fit.
            <br />
            <span className="stroke-light">Or make your own.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={cta({ tone: "light" })}>
              Shop now <ArrowRightIcon className="arrow" />
            </Link>
            <Link href="/customize" className={cta({ tone: "outline-light" })}>
              Customize <ArrowRightIcon className="arrow" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
