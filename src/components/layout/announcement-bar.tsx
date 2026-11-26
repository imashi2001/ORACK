import { StarMark } from "@/components/shop/icons";

/** Scrolling ticker of store announcements (from Admin → Settings). */
export function AnnouncementBar({ items }: { items: string[] }) {
  if (!items.length) return null;
  // Repeat so the loop is seamless even with one short message.
  const loop = Array.from({ length: Math.max(2, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="overflow-hidden border-b border-[#1f1f1f] bg-black py-2.5 text-[#d4d4d4]">
      <p className="sr-only">{items.join(". ")}</p>
      <div aria-hidden="true" className="animate-marquee flex w-max items-center gap-8 [animation-duration:55s]">
        {[...loop, ...loop].map((text, i) => (
          <span key={i} className="eyebrow flex items-center gap-8 whitespace-nowrap">
            {text}
            <StarMark className="size-2.5 fill-[#6b6b6b]" />
          </span>
        ))}
      </div>
    </div>
  );
}
