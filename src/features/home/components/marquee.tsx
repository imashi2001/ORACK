import { StarMark } from "@/components/shop/icons";
import { cn } from "@/lib/utils";

const TOP = ["Wear your identity", "T-Shirts", "Hoodies", "Custom designs", "ORACK.", "Islandwide delivery"];
const BOTTOM = ["New drop", "Order on WhatsApp", "Made in Sri Lanka", "Oversized fits", "Print your idea", "ORACK."];

function Band({ words, dark, reverse, rotate }: { words: string[]; dark?: boolean; reverse?: boolean; rotate: string }) {
  const items = [...words, ...words];
  return (
    <div className={cn("relative -mx-[5vw] overflow-hidden border-y-2 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]", dark ? "border-white bg-ink text-white" : "border-ink bg-white text-ink", rotate)}>
      <div className={cn("flex w-max items-center gap-9", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-9">
            <span className="display text-[clamp(22px,2.6vw,30px)] whitespace-nowrap">{w}</span>
            <StarMark className="size-4" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two crossing "caution tape" tickers. */
export function Marquee() {
  return (
    <div aria-hidden="true" className="relative z-10 overflow-hidden bg-ink py-7">
      <Band words={TOP} rotate="-rotate-[1.6deg]" />
      <div className="-mt-3">
        <Band words={BOTTOM} dark reverse rotate="rotate-[1.4deg]" />
      </div>
    </div>
  );
}
