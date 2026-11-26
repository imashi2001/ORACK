import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageHero, Section } from "@/components/shop/info-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for ordering from ORACK and requesting custom designs.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero crumb="Terms" eyebrow="Legal" title="Terms of service" intro="The short version: we confirm every order with you on WhatsApp before you pay, and custom work only starts once you approve the quote." />
      <PageBody
        updated="26 November 2026"
        toc={[
          { id: "orders", label: "Orders" },
          { id: "prices", label: "Prices & payment" },
          { id: "delivery", label: "Delivery & returns" },
          { id: "custom", label: "Custom designs" },
          { id: "site", label: "Using this website" },
        ]}
      >
        <Section id="orders" title="Orders">
          <ul>
            <li>Placing an order on this website sends us a request and holds the stock for you. It isn&apos;t a contract yet.</li>
            <li>Your order is accepted when we confirm it with you on WhatsApp, including the final total and delivery fee.</li>
            <li>We may decline or cancel an order, for example if an item turns out to be unavailable or a price was shown incorrectly. If you&apos;ve already paid, we&apos;ll refund you in full.</li>
          </ul>
        </Section>

        <Section id="prices" title="Prices & payment">
          <ul>
            <li>Prices are shown in Sri Lankan rupees (LKR). The delivery fee is added when we confirm your order.</li>
            <li>You don&apos;t pay on this website. We share payment options on WhatsApp, and your order is dispatched once payment is received.</li>
          </ul>
        </Section>

        <Section id="delivery" title="Delivery & returns">
          <p>
            Delivery, returns and exchanges are covered on our <Link href="/delivery-returns">Delivery &amp; returns</Link> page.
          </p>
        </Section>

        <Section id="custom" title="Custom designs">
          <ul>
            <li>A custom design request is not an order. We review it and send a quotation; nothing is printed or charged until you accept.</li>
            <li>
              By uploading an image you confirm that you own it or have permission to use it. We won&apos;t print other brands&apos; logos, characters, copyrighted artwork, or anything
              offensive, and we may decline any request.
            </li>
            <li>Colours on screen and on fabric can differ slightly, and printed placement may vary by a few millimetres.</li>
            <li>Custom pieces are made just for you, so they can&apos;t be returned for a change of mind or size unless there&apos;s a fault on our side.</li>
          </ul>
        </Section>

        <Section id="site" title="Using this website">
          <ul>
            <li>Product photos are as accurate as we can make them, but colours can look different on different screens.</li>
            <li>The ORACK name, logo and designs belong to ORACK and can&apos;t be copied or used without permission.</li>
            <li>
              We may update these terms from time to time. The version on this page applies to orders placed after the date below. See also our <Link href="/privacy">Privacy policy</Link>.
            </li>
          </ul>
        </Section>
      </PageBody>
    </>
  );
}
