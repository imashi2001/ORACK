import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Container } from "@/components/shop/container";
import { FacebookIcon, InstagramIcon, MailIcon, TikTokIcon, WhatsAppIcon } from "@/components/shop/icons";
import { PageHero } from "@/components/shop/info-page";
import { getPublicSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to ORACK on WhatsApp, by email, or on Instagram, TikTok and Facebook.",
};

export default async function ContactPage() {
  const s = await getPublicSettings();
  const channels = [
    s.whatsappNumber && {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      value: formatWhatsAppDisplay(s.whatsappNumber),
      note: "Fastest. Orders, sizing and custom designs.",
      href: buildWhatsAppUrl("Hi ORACK! I have a question.", s.whatsappNumber),
      primary: true,
    },
    s.contactEmail && { icon: MailIcon, label: "Email", value: s.contactEmail, note: "For anything longer or more detailed.", href: `mailto:${s.contactEmail}` },
    s.instagramUrl && { icon: InstagramIcon, label: "Instagram", value: "@orack.clothing", note: "New drops, fits and behind the scenes.", href: s.instagramUrl },
    s.tiktokUrl && { icon: TikTokIcon, label: "TikTok", value: "@orack42", note: "Watch the latest drops in motion.", href: s.tiktokUrl },
    s.facebookUrl && { icon: FacebookIcon, label: "Facebook", value: "ORACK", note: "Follow for updates and offers.", href: s.facebookUrl },
  ].filter(Boolean) as { icon: typeof MailIcon; label: string; value: string; note: string; href: string; primary?: boolean }[];

  return (
    <>
      <PageHero crumb="Contact" eyebrow="Get in touch" ghost="TALK" title="Talk to us." intro="Questions about an order, sizing or a custom design? Pick whichever way suits you." />
      <Container className="flex flex-col gap-10 py-[clamp(40px,6vw,88px)]">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map(({ icon: Icon, label, value, note, href, primary }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={
                  primary
                    ? "group flex h-full flex-col gap-6 bg-ink p-6 text-white transition-colors hover:bg-[#1c1c1c] sm:p-7"
                    : "group flex h-full flex-col gap-6 border border-line bg-white p-6 transition-colors hover:border-ink sm:p-7"
                }
              >
                <span className="flex items-center justify-between">
                  <Icon className="size-7" />
                  <ArrowUpRightIcon className="size-5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className={primary ? "eyebrow text-white/60" : "eyebrow text-smoke"}>{label}</span>
                  <span className="text-xl font-bold break-all">{value}</span>
                  <span className={primary ? "text-sm text-white/70" : "text-sm text-graphite"}>{note}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Asking about an order?</h2>
            <p className="leading-relaxed text-graphite">
              Include your order reference (it starts with <strong className="text-ink">ORK-</strong>) so we can find it straight away.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Looking for a quick answer?</h2>
            <p className="leading-relaxed text-graphite">
              Most questions about payment, delivery and sizing are answered in our{" "}
              <Link href="/help" className="font-semibold text-ink underline underline-offset-3">
                Help &amp; FAQ
              </Link>
              .
            </p>
          </div>
          {s.address && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">Address</h2>
              <p className="leading-relaxed whitespace-pre-line text-graphite">{s.address}</p>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
