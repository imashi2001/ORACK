import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { WhatsAppIcon } from "@/components/shop/icons";
import { PageBody, PageHero } from "@/components/shop/info-page";
import { FAQ } from "@/config/faq";
import { getPublicSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "Answers about ordering, payment, delivery, sizing, returns and custom designs at ORACK.",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");

export default async function HelpPage() {
  const settings = await getPublicSettings();
  const whatsappUrl = buildWhatsAppUrl("Hi ORACK! I have a question.", settings.whatsappNumber);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        crumb="Help"
        eyebrow="Help centre"
        ghost="HELP"
        title="How can we help?"
        intro="Quick answers about ordering, delivery, sizing and custom designs. Can't find what you need? We're one message away."
      />
      <PageBody toc={FAQ.map((g) => ({ id: slug(g.group), label: g.group }))}>
        {FAQ.map((g) => (
          <section key={g.group} id={slug(g.group)} aria-labelledby={`${slug(g.group)}-title`} className="scroll-mt-28">
            <h2 id={`${slug(g.group)}-title`} className="display mb-4 text-[clamp(30px,3.6vw,44px)]">
              {g.group}
            </h2>
            <div className="border-b border-line">
              {g.items.map((item) => (
                <details key={item.q} className="group border-t border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line transition-colors group-open:border-ink group-open:bg-ink group-open:text-white">
                      <PlusIcon className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="flex flex-col gap-3 pb-6 leading-relaxed text-graphite sm:pr-12">
                    <p>{item.a}</p>
                    {item.link && (
                      <Link href={item.link.href} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink underline underline-offset-3">
                        {item.link.label} <ArrowRightIcon className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-col items-start gap-5 bg-ink p-7 text-white sm:p-10">
          <h2 className="display text-[clamp(32px,4vw,48px)]">Still stuck?</h2>
          <p className="max-w-md text-[#c9c9c9]">Message us on WhatsApp. A real person from the ORACK team will get back to you.</p>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cta({ tone: "light" })}>
              <WhatsAppIcon /> Chat on WhatsApp
            </a>
            <Link href="/contact" className={cta({ tone: "outline-light" })}>
              Other ways to reach us
            </Link>
          </div>
        </div>
      </PageBody>
    </>
  );
}
