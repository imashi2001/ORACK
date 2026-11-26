import { cn } from "@/lib/utils";
import { MARK, WORDMARK } from "./logo-paths";

/**
 * Official ORACK logo as inline SVG. Every part uses `currentColor`, so it is
 * black on light surfaces and white on dark ones. Pass `title` when the logo
 * is the only content of a link; omit it when it's purely decorative.
 */
interface Props {
  className?: string;
  title?: string;
}

function a11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
}

/** The angular "OK" monogram. */
export function LogoMark({ className, title, outline }: Props & { outline?: boolean }) {
  return (
    <svg viewBox={MARK.viewBox} className={cn("block h-auto", className)} {...a11y(title)}>
      <path
        d={MARK.d}
        fillRule="evenodd"
        fill={outline ? "none" : "currentColor"}
        stroke={outline ? "currentColor" : undefined}
        strokeWidth={outline ? 3 : undefined}
        vectorEffect={outline ? "non-scaling-stroke" : undefined}
      />
    </svg>
  );
}

/** The wide, rounded ORACK wordmark. */
export function LogoWordmark({ className, title }: Props) {
  return (
    <svg viewBox={WORDMARK.viewBox} className={cn("block h-auto", className)} {...a11y(title)}>
      <path d={WORDMARK.d} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}

/** Mark beside the wordmark: for headers and navigation. */
export function LogoHorizontal({ className, title = "ORACK" }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-[0.55em]", className)} role="img" aria-label={title}>
      <LogoMark className="h-[1.25em] w-auto" />
      <LogoWordmark className="h-[0.52em] w-auto" />
    </span>
  );
}

/** Mark above the wordmark, as on the official artwork: for footers and sign-in. */
export function LogoStacked({ className, title = "ORACK" }: Props) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-[0.3em]", className)} role="img" aria-label={title}>
      <LogoMark className="h-[2em] w-auto" />
      <LogoWordmark className="h-[0.62em] w-auto" />
    </span>
  );
}
