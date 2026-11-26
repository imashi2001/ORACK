import type { SVGProps } from "react";
import { MARK } from "@/components/brand/logo-paths";

/** WhatsApp-style chat bubble (line icon, matches lucide stroke weight). */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9 8.6c.2 3.2 3 6 6.3 6.3l1.2-1.5-2-1-1 .9c-1.2-.5-2.3-1.6-2.9-2.9l.9-1-1-2z" />
    </svg>
  );
}

/** Small ORACK monogram used as a separator glyph (tickers, badges)....... */
export function BrandGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={MARK.viewBox} fill="currentColor" aria-hidden="true" {...props}>
      <path d={MARK.d} fillRule="evenodd" />
    </svg>
  );
}

const line = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...line} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...line} {...props}>
      <path d="M15 3.5h-2.2A3.8 3.8 0 0 0 9 7.3V10H6.5v3.5H9V21h3.6v-7.5h2.7l.6-3.5h-3.3V7.8c0-.6.4-1 1-1H15z" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...line} {...props}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...line} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}
