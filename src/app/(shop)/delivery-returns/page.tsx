import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageHero, Section } from "@/components/shop/info-page";
import { getPublicSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Delivery & returns",
  description: "Islandwide delivery across Sri Lanka, and what to do if something isn't right with your ORACK order.",
};

export default async function DeliveryReturnsPage() {
  const settings = await getPublicSettings();
  const whatsappUrl = buildWhatsAppUrl("Hi ORACK! I need help with my order.", settings.whatsappNumber);

  return (
    <>
      <PageHero crumb="Delivery & returns" eyebrow="Shipping" ghost="SHIP" title="Delivery & returns" intro="We deliver islandwide. If anything isn't right when it arrives, we'll sort it out." />
      <PageBody
        updated="26 November 2026"
        toc={[
          { id: "delivery", label: "Delivery" },
          { id: "returns", label: "Returns & exchanges" },
          { id: "custom", label: "Custom orders" },
        ]}
      >
        <Section id="delivery" title="Delivery">
          {settings.deliveryInfo && <p className="border-l-2 border-ink bg-white p-4 whitespace-pre-line text-ink">{settings.deliveryInfo}</p>}
          <ul>
            <li>We deliver anywhere in Sri Lanka.</li>
            <li>The delivery fee and estimated delivery time depend on your location. We confirm both with you on WhatsApp before you pay.</li>
            <li>Your order is packed and dispatched after it&apos;s confirmed and paid.</li>
            <li>
              Need an update? Send us your order reference (it starts with <strong>ORK-</strong>) on{" "}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section id="returns" title="Returns & exchanges">
          <p>
            <strong>Faulty, damaged or wrong item?</strong> Message us on WhatsApp as soon as your order arrives, with your order reference and a photo. We&apos;ll replace it or put it right.
          </p>
          <p>
            <strong>Wrong size?</strong> Get in touch and we&apos;ll do our best to exchange it, subject to stock. Items should be unworn, unwashed and in their original condition.
          </p>
          <p>
            Check the <Link href="/size-guide">size guide</Link> before ordering. It&apos;s the quickest way to avoid an exchange.
          </p>
        </Section>

        <Section id="custom" title="Custom orders">
          <p>Custom-printed pieces are made just for you, so they can&apos;t be returned or exchanged for a change of mind or size. If there&apos;s a fault or a print error on our side, we&apos;ll fix it.</p>
          <p>That&apos;s why we always send a quote and confirm every detail with you on WhatsApp before anything is printed.</p>
        </Section>
      </PageBody>
    </>
  );
}
