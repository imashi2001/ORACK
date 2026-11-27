import { cn } from "@/lib/utils";
import type { Lights } from "../config";

const COLOURS = ["#ff5a5f", "#ffd166", "#3ddc97", "#4cc9f0", "#f4a261"];

/** A string of twinkling bulbs hanging along the bottom edge of the header. Purely decorative. */
export function StringLights({ mode, className }: { mode: Exclude<Lights, "off">; className?: string }) {
  const count = 28;
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-full h-6 overflow-hidden", className)}>
      <svg className="absolute inset-x-0 top-0 h-3 w-full" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M0 0 Q 2.5 8 5 0 T 10 0 T 15 0 T 20 0 T 25 0 T 30 0 T 35 0 T 40 0 T 45 0 T 50 0 T 55 0 T 60 0 T 65 0 T 70 0 T 75 0 T 80 0 T 85 0 T 90 0 T 95 0 T 100 0" fill="none" stroke="#2a2a2a" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-around px-[1.75%]">
        {Array.from({ length: count }, (_, i) => {
          const colour = mode === "warm" ? "#ffd89a" : COLOURS[i % COLOURS.length];
          return (
            <span
              key={i}
              className="seasonal-bulb block h-2.5 w-1.5 rounded-b-full"
              style={{ backgroundColor: colour, color: colour, marginTop: i % 2 ? 6 : 2, animationDelay: `${(i % 7) * 0.35}s` }}
            />
          );
        })}
      </div>
    </div>
  );
}
