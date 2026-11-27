import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Container } from "@/components/shop/container";
import { cta } from "@/components/shop/cta";
import type { PublicSettings } from "@/features/settings/queries";
import { LogoHorizontal, LogoMark, LogoWordmark } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, MailIcon, TikTokIcon, WhatsAppIcon } from "@/components/shop/icons";
import { siteConfig } from "@/config/site";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";

const footerLink = "text-[#a3a3a3] transition-colors hover:text-white";

export function SiteFooter({ whatsappUrl, settings, categories }: { whatsappUrl: string; settings: PublicSettings; categories: { slug: string; name: string }[] }) {
  const socials = [
    { label: "Instagram", href: settings.instagramUrl, icon: InstagramIcon },
    { label: "TikTok", href: settings.tiktokUrl, icon: TikTokIcon },
    { label: "Facebook", href: settings.facebookUrl, icon: FacebookIcon },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  return (
    <footer className="border-t border-[#1d1d1d] bg-black text-white">
      <Container className="flex flex-col gap-14 pt-18 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-[#1d1d1d] pb-12">
          <h2 className="display text-[clamp(44px,5.5vw,80px)]">
            Questions?
            <br />
            Talk to us.
          </h2>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cta({ tone: "light" })}>
            Chat on WhatsApp <ArrowRightIcon className="arrow" />
          </a>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-10">
          <div className="flex flex-col gap-4">
            <LogoHorizontal className="text-[30px]" title={settings.businessName} />
            <p className="max-w-64 text-sm leading-relaxed text-[#a3a3a3]">{siteConfig.tagline}. Streetwear and custom prints in black and white.</p>
            {socials.length > 0 && (
              <ul className="flex gap-2">
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`ORACK on ${label}`}
                      className="flex size-11 items-center justify-center border border-[#2a2a2a] text-[#bdbdbd] transition-colors hover:border-white hover:bg-white hover:text-ink"
                    >
                      <Icon className="size-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <nav aria-label="Shop" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Shop</span>
            {categories.map((c) => (
              <Link key={c.slug} className={footerLink} href={`/products?category=${c.slug}`}>
                {c.name}
              </Link>
            ))}
            <Link className={footerLink} href="/products?sort=newest">
              New arrivals
            </Link>
            <Link className={footerLink} href="/customize">
              Custom designs
            </Link>
          </nav>
          <nav aria-label="Help" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Help</span>
            <Link className={footerLink} href="/help">
              Help &amp; FAQ
            </Link>
            <Link className={footerLink} href="/#how-it-works">
              How ordering works
            </Link>
            <Link className={footerLink} href="/size-guide">
              Size guide
            </Link>
            <Link className={footerLink} href="/delivery-returns">
              Delivery &amp; returns
            </Link>
            <Link className={footerLink} href="/contact">
              Contact us
            </Link>
          </nav>
          <div className="flex flex-col gap-3 text-sm text-[#a3a3a3]">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Contact</span>
            {settings.whatsappNumber && (
              <a className={`${footerLink} inline-flex items-center gap-2`} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" /> {formatWhatsAppDisplay(settings.whatsappNumber)}
              </a>
            )}
            {settings.contactPhone && <span>Phone: {settings.contactPhone}</span>}
            {settings.contactEmail && (
              <a className={`${footerLink} inline-flex items-center gap-2 break-all`} href={`mailto:${settings.contactEmail}`}>
                <MailIcon className="size-4 shrink-0" /> {settings.contactEmail}
              </a>
            )}
            {settings.address && <span className="whitespace-pre-line">{settings.address}</span>}
          </div>
        </div>

        <div aria-hidden="true" className="relative -mx-2 overflow-hidden pt-[clamp(28px,4vw,56px)] select-none">
          <div className="flex items-end gap-[3vw] px-2">
            <LogoMark className="w-[18%] shrink-0 text-white" />
            <LogoWordmark className="w-full text-white" />
          </div>
          <span className="marker absolute top-0 right-[2%] rotate-[-6deg] text-[clamp(16px,2vw,26px)] text-[#a3a3a3]">live bold. wear ORACK</span>
        </div>

        <div className="eyebrow flex flex-wrap justify-between gap-4 border-t border-[#1d1d1d] pt-6 text-[#8f8f8f]">
          <span>© 2026 {settings.businessName}. All rights reserved.</span>
          <span className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <span>Prices in LKR · Pay on confirmation</span>
          </span>
        </div>
      </Container>
    </footer>
  );
}
