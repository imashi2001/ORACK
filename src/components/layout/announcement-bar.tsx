import { Fragment } from "react";

export function AnnouncementBar({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border-b border-[#1f1f1f] bg-black text-[#d4d4d4]">
      <div className="eyebrow mx-auto flex max-w-[1360px] flex-wrap justify-center gap-7 px-5 py-2.5">
        {items.map((text, i) => (
          <Fragment key={`${i}-${text}`}>
            {i > 0 && (
              <span className="hidden text-[#555] md:inline" aria-hidden="true">
                /
              </span>
            )}
            <span className={i > 0 ? "hidden md:inline" : undefined}>{text}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
