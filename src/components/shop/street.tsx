import { cn } from "@/lib/utils";

/** Rotated label sticker, e.g. "NEW", "DROP 01". */
export function Sticker({ children, tone = "light", rotate = -4, className }: { children: React.ReactNode; tone?: "light" | "dark" | "outline"; rotate?: number; className?: string }) {
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "eyebrow inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] leading-none font-medium shadow-[2px_2px_0_rgba(0,0,0,0.25)]",
        tone === "light" && "bg-white text-ink",
        tone === "dark" && "bg-ink text-white",
        tone === "outline" && "border-[1.5px] border-current bg-transparent shadow-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Strip of masking tape, purely decorative. */
export function Tape({ className, rotate = -8, children, onLight }: { className?: string; rotate?: number; children?: React.ReactNode; onLight?: boolean }) {
  return (
    <span
      aria-hidden={children ? undefined : true}
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn("tape absolute z-10 flex h-6 w-24 items-center justify-center sm:h-7 sm:w-28", onLight && "bg-[#cfcfca]/80", className)}
    >
      {children && <span className="eyebrow text-[9px] text-ink">{children}</span>}
    </span>
  );
}

/** Slowly spinning circular text badge. */
export function SpinBadge({ text, className, dark, id = "a" }: { text: string; className?: string; dark?: boolean; id?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute block size-28 sm:size-32", className)}>
      <svg viewBox="0 0 100 100" className="animate-spin-slow size-full">
        <defs>
          <path id={`spin-badge-${id}`} d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <circle cx="50" cy="50" r="48" fill={dark ? "#0a0a0a" : "#fff"} />
        <text fontSize="9.2" letterSpacing="2.4" fill={dark ? "#fff" : "#0a0a0a"} style={{ fontFamily: "var(--font-jetbrains), monospace", textTransform: "uppercase" }}>
          <textPath href={`#spin-badge-${id}`} textLength="234" lengthAdjust="spacing">{text}</textPath>
        </text>
      </svg>
      <svg viewBox="-14 -14 28 28" className={cn("absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2", dark ? "fill-white" : "fill-ink")}>
        <path d="M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z" />
      </svg>
    </span>
  );
}

/** Big section heading with an index tag and an outlined ghost word behind it. */
export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  ghost,
  dark,
  note,
}: {
  id?: string;
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  ghost?: string;
  dark?: boolean;
  note?: string;
}) {
  return (
    <div className="relative flex flex-col gap-3.5">
      {ghost && (
        <span aria-hidden="true" className={cn("display pointer-events-none absolute -top-[0.45em] -left-1 text-[clamp(90px,15vw,210px)] whitespace-nowrap select-none", dark ? "text-outline" : "stroke-ghost")}>
          {ghost}
        </span>
      )}
      <span className={cn("eyebrow relative flex items-center gap-3 text-xs", dark ? "text-[#a3a3a3]" : "text-smoke")}>
        <span className={cn("px-1.5 py-0.5", dark ? "bg-white text-ink" : "bg-ink text-white")}>{index}</span>
        {eyebrow}
      </span>
      <h2 id={id} className="display relative text-[clamp(48px,6vw,88px)]">
        {title}
      </h2>
      {note && <span className={cn("marker relative -mt-1 rotate-[-3deg] self-start text-lg", dark ? "text-[#d4d4d4]" : "text-graphite")}>{note}</span>}
    </div>
  );
}
