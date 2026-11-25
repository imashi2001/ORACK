import { StarMark } from "@/components/shop/icons";

const WORDS = ["Wear your identity", "T-Shirts", "Hoodies", "Custom designs", "ORACK.", "Islandwide delivery"];

export function Marquee() {
  // Content is duplicated so the -50% translate loops seamlessly.
  const items = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden border-t border-black bg-white py-4 text-ink" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center gap-10">
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="display text-[26px] whitespace-nowrap">{w}</span>
            <StarMark className="size-4.5" />
          </span>
        ))}
      </div>
    </div>
  );
}
