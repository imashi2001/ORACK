import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Container } from "@/components/shop/container";
import { cta } from "@/components/shop/cta";
import type { PublicSettings } from "@/features/settings/queries";

const footerLink = "text-[#a3a3a3] transition-colors hover:text-white";

export function SiteFooter({ whatsappUrl, settings }: { whatsappUrl: string; settings: PublicSettings }) {
  const socials = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "TikTok", href: settings.tiktokUrl },
    { label: "Facebook", href: settings.facebookUrl },
  ].filter((s): s is { label: string; href: string } => !!s.href);

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
            <span className="display text-4xl">{settings.businessName}.</span>
            <p className="max-w-64 text-sm leading-relaxed text-[#a3a3a3]">Minimal streetwear and custom prints, made in Sri Lanka.</p>
            {socials.length > 0 && (
              <div className="-ml-2.5 flex gap-1 text-sm">
                {socials.map((s) => (
                  <a key={s.label} className="px-2.5 py-2 text-[#a3a3a3] hover:text-white" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <nav aria-label="Shop" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Shop</span>
            <Link className={footerLink} href="/products?category=t-shirts">T-Shirts</Link>
            <Link className={footerLink} href="/products?category=hoodies">Hoodies</Link>
            <Link className={footerLink} href="/products?sort=newest">New arrivals</Link>
            <Link className={footerLink} href="/customize">Custom designs</Link>
          </nav>
          <nav aria-label="Help" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Help</span>
            <Link className={footerLink} href="/#how-it-works">How ordering works</Link>
            <a className={footerLink} href={whatsappUrl} target="_blank" rel="noopener noreferrer">Order status</a>
            {settings.deliveryInfo && <span className="max-w-64 leading-relaxed text-[#a3a3a3]">{settings.deliveryInfo}</span>}
          </nav>
          <div className="flex flex-col gap-3 text-sm text-[#a3a3a3]">
            <span className="eyebrow mb-1.5 text-[#8f8f8f]">Contact</span>
            {settings.whatsappNumber && <span>WhatsApp: {settings.whatsappNumber}</span>}
            {settings.contactPhone && <span>Phone: {settings.contactPhone}</span>}
            {settings.contactEmail && (
              <a className={footerLink} href={`mailto:${settings.contactEmail}`}>
                {settings.contactEmail}
              </a>
            )}
            {settings.address && <span className="whitespace-pre-line">{settings.address}</span>}
          </div>
        </div>

        <div aria-hidden="true" className="relative -mx-2 overflow-hidden select-none">
          <span className="display block text-center text-[clamp(96px,24vw,360px)] leading-[0.8] text-white">{settings.businessName}.</span>
          <span className="marker absolute right-[6%] bottom-[18%] rotate-[-8deg] text-[clamp(16px,2vw,26px)] text-[#a3a3a3]">wear your identity</span>
        </div>

        <div className="eyebrow flex flex-wrap justify-between gap-4 border-t border-[#1d1d1d] pt-6 text-[#8f8f8f]">
          <span>© 2026 {settings.businessName}. All rights reserved.</span>
          <span>Prices in LKR · Pay on confirmation</span>
        </div>
      </Container>
    </footer>
  );
}
