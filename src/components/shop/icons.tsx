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

/** Small ORACK monogram used as a separator glyph (tickers, badges). */
export function BrandGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={MARK.viewBox} fill="currentColor" aria-hidden="true" {...props}>
      <path d={MARK.d} fillRule="evenodd" />
    </svg>
  );
}
