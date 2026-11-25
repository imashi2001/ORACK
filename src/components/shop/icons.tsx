import type { SVGProps } from "react";

/** WhatsApp-style chat bubble (line icon, matches lucide stroke weight). */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9 8.6c.2 3.2 3 6 6.3 6.3l1.2-1.5-2-1-1 .9c-1.2-.5-2.3-1.6-2.9-2.9l.9-1-1-2z" />
    </svg>
  );
}

export function StarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-14 -14 28 28" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z" />
    </svg>
  );
}
