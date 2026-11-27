import type { Metadata } from "next";
import { PageBody, PageHero, Section } from "@/components/shop/info-page";
import { getPublicSettings } from "@/features/settings/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy policy",
  description: "What personal information ORACK collects when you order or request a custom design, and how it's used and protected.",
};

export default async function PrivacyPage() {
  const s = await getPublicSettings();
  return (
    <>
      <PageHero crumb="Privacy" eyebrow="Legal" title="Privacy policy" intro="We only ask for what we need to make and deliver your order, and we never sell your information." />
      <PageBody
        updated="26 November 2026"
        toc={[
          { id: "collect", label: "What we collect" },
          { id: "use", label: "How we use it" },
          { id: "share", label: "Who we share it with" },
          { id: "store", label: "Storage & security" },
          { id: "rights", label: "Your choices" },
        ]}
      >
        <Section id="collect" title="What we collect">
          <ul>
            <li>
              <strong>When you place an order:</strong> your name, phone number, delivery address, any note you add, and the items you ordered.
            </li>
            <li>
              <strong>When you request a custom design:</strong> your name, phone number, the details of your request and any reference images you upload.
            </li>
            <li>
              <strong>When you message us on WhatsApp or email:</strong> whatever you choose to send us.
            </li>
            <li>
              <strong>Technical information:</strong> to stop abuse we keep a short-lived, scrambled record of request addresses. We don&apos;t use advertising or tracking cookies. Your bag is saved
              only in your own browser.
            </li>
          </ul>
        </Section>

        <Section id="use" title="How we use it">
          <ul>
            <li>To confirm, prepare and deliver your order, and to contact you about it.</li>
            <li>To review custom design requests and send you a quote.</li>
            <li>To answer your questions and handle returns or exchanges.</li>
            <li>To keep the website secure and working properly.</li>
          </ul>
          <p>We don&apos;t sell your information or use it for advertising.</p>
        </Section>

        <Section id="share" title="Who we share it with">
          <p>We share only what&apos;s needed, with:</p>
          <ul>
            <li>delivery services, so they can bring your order to you (name, phone number and address);</li>
            <li>the service providers that host this website, its database and image storage, who keep it on our behalf.</li>
          </ul>
          <p>We may also disclose information if the law requires it.</p>
        </Section>

        <Section id="store" title="Storage & security">
          <p>
            Your information is stored with secure hosting providers. Reference images for custom designs are kept in private storage that only our team can open, through short-lived links.
            We keep order records for as long as we need them for the order, returns and our accounts.
          </p>
        </Section>

        <Section id="rights" title="Your choices">
          <p>
            You can ask us what information we hold about you, ask us to correct it, or ask us to delete it where we don&apos;t need to keep it.{" "}
            {s.contactEmail ? (
              <>
                Email <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> or message us on WhatsApp.
              </>
            ) : (
              "Message us on WhatsApp."
            )}
          </p>
        </Section>
      </PageBody>
    </>
  );
}
