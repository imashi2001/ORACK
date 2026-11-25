import type { GarmentKind, PrintStyle, Tone } from "../types";

/**
 * Vector garment render used until real product photography is uploaded to R2.
 * Pure SVG, no hooks — safe in Server and Client Components.
 */

const PALETTE: Record<Tone, { base: string; light: string; dark: string; rib: string; ink: string; fold: string; hi: string; vignette: number; pocket: string; string: string }> = {
  black: { base: "#1d1d1d", light: "#353535", dark: "#0c0c0c", rib: "#141414", ink: "#f2f2f0", fold: "rgba(0,0,0,0.45)", hi: "rgba(255,255,255,0.06)", vignette: 0.35, pocket: "rgba(0,0,0,0.12)", string: "#e9e9e6" },
  white: { base: "#ecebe8", light: "#fbfbf9", dark: "#cfcdc9", rib: "#dedcd8", ink: "#111111", fold: "rgba(0,0,0,0.10)", hi: "rgba(255,255,255,0.7)", vignette: 0.12, pocket: "rgba(0,0,0,0.03)", string: "#ffffff" },
  ash: { base: "#a6a6a3", light: "#bdbdba", dark: "#878784", rib: "#979794", ink: "#111111", fold: "rgba(0,0,0,0.16)", hi: "rgba(255,255,255,0.25)", vignette: 0.2, pocket: "rgba(0,0,0,0.05)", string: "#f2f2f0" },
  charcoal: { base: "#424242", light: "#575757", dark: "#2b2b2b", rib: "#383838", ink: "#f2f2f0", fold: "rgba(0,0,0,0.35)", hi: "rgba(255,255,255,0.07)", vignette: 0.3, pocket: "rgba(0,0,0,0.1)", string: "#e9e9e6" },
};

const TEE = "M150 46 Q200 80 250 46 L304 62 L368 150 L326 192 L292 168 L296 418 Q200 426 104 418 L108 168 L74 192 L32 150 L96 62 Z";
const HOODIE = "M128 80 Q132 24 200 20 Q268 24 272 80 L314 94 L362 200 L372 384 L330 390 L320 236 L302 206 L304 412 Q200 420 96 412 L98 206 L80 236 L70 390 L28 384 L38 200 L86 94 Z";
const STAR = "M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z";

const wordmark = { fontFamily: "var(--font-archivo), sans-serif", fontWeight: 900, fontStyle: "italic", fontStretch: "70%" } as const;

interface GarmentArtProps {
  kind: GarmentKind;
  tone: Tone;
  print?: PrintStyle;
  shadow?: boolean;
  className?: string;
  title?: string;
}

export function GarmentArt({ kind, tone, print = "chest", shadow = true, className, title }: GarmentArtProps) {
  const c = PALETTE[tone];
  const isTee = kind === "tee";
  // Deterministic ids: identical props produce identical gradients, so duplicates are harmless.
  const id = `orack-${kind}-${tone}`;
  const pos = isTee
    ? { chestX: 246, chestY: 128, chestSize: 22, backY: 196, starY: 246, globeY: 178, globeTextY: 262, sleeveX: 66, sleeveY: 150, sleeveR: 45 }
    : { chestX: 200, chestY: 250, chestSize: 30, backY: 238, starY: 288, globeY: 222, globeTextY: 290, sleeveX: 52, sleeveY: 300, sleeveR: -84 };

  return (
    <svg viewBox="0 0 400 440" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.55" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <radialGradient id={`${id}-s`} cx="0.5" cy={isTee ? 0.3 : 0.35} r="0.75">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={c.vignette} />
        </radialGradient>
      </defs>

      {shadow && <ellipse cx="200" cy="428" rx={isTee ? 150 : 160} ry="7" fill="#000" opacity="0.18" />}

      {isTee ? (
        <g>
          <path d={TEE} fill={`url(#${id}-b)`} />
          <path d={TEE} fill={`url(#${id}-s)`} />
          <path d="M158 47 Q200 70 242 47 Q200 58 158 47 Z" fill={c.dark} />
          <path d="M150 46 Q200 80 250 46" fill="none" stroke={c.rib} strokeWidth="9" strokeLinecap="round" />
          <path d="M96 62 Q124 118 108 168" fill="none" stroke={c.fold} strokeWidth="3" />
          <path d="M304 62 Q276 118 292 168" fill="none" stroke={c.fold} strokeWidth="3" />
          <path d="M150 236 Q172 310 158 404" fill="none" stroke={c.fold} strokeWidth="14" strokeLinecap="round" opacity="0.5" />
          <path d="M254 262 Q238 330 250 406" fill="none" stroke={c.fold} strokeWidth="10" strokeLinecap="round" opacity="0.45" />
          <path d="M188 300 Q200 350 196 408" fill="none" stroke={c.hi} strokeWidth="8" strokeLinecap="round" opacity="0.5" />
          <path d="M107 405 Q200 413 293 405" fill="none" stroke={c.fold} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M42 141 L82 181" fill="none" stroke={c.fold} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M358 141 L318 181" fill="none" stroke={c.fold} strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
      ) : (
        <g>
          <path d={HOODIE} fill={`url(#${id}-b)`} />
          <path d={HOODIE} fill={`url(#${id}-s)`} />
          <path d="M154 82 Q200 132 246 82 Q242 42 200 38 Q158 42 154 82 Z" fill={c.dark} />
          <path d="M154 82 Q200 132 246 82" fill="none" stroke={c.rib} strokeWidth="7" strokeLinecap="round" />
          <path d="M182 106 Q178 150 181 186" fill="none" stroke={c.string} strokeWidth="4" strokeLinecap="round" />
          <path d="M218 106 Q222 150 219 190" fill="none" stroke={c.string} strokeWidth="4" strokeLinecap="round" />
          <rect x="177" y="184" width="8" height="14" rx="2" fill={c.string} />
          <rect x="215" y="188" width="8" height="14" rx="2" fill={c.string} />
          <path d="M86 94 Q112 150 98 206" fill="none" stroke={c.fold} strokeWidth="3" />
          <path d="M314 94 Q288 150 302 206" fill="none" stroke={c.fold} strokeWidth="3" />
          <path d="M136 302 L264 302 L288 380 L112 380 Z" fill={c.pocket} stroke={c.fold} strokeWidth="2" />
          <path d="M96 394 Q200 402 304 394 L304 412 Q200 420 96 412 Z" fill={c.rib} />
          <path d="M30 366 L72 372 L70 390 L28 384 Z" fill={c.rib} />
          <path d="M370 366 L328 372 L330 390 L372 384 Z" fill={c.rib} />
          <path d="M150 214 Q168 270 160 296" fill="none" stroke={c.fold} strokeWidth="12" strokeLinecap="round" opacity="0.45" />
          <path d="M60 250 Q56 310 58 360" fill="none" stroke={c.fold} strokeWidth="9" strokeLinecap="round" opacity="0.45" />
          <path d="M342 250 Q346 310 344 360" fill="none" stroke={c.fold} strokeWidth="9" strokeLinecap="round" opacity="0.45" />
        </g>
      )}

      {(print === "chest" || print === "sleeve") && (
        <text x={pos.chestX} y={pos.chestY} fontSize={pos.chestSize} fill={c.ink} textAnchor="middle" opacity={print === "sleeve" ? 0.18 : 1} style={wordmark}>
          ORACK.
        </text>
      )}

      {print === "back" && (
        <g fill={c.ink}>
          <g transform={`translate(200 ${pos.backY}) rotate(-9)`}>
            <text x="0" y="0" fontSize="74" textAnchor="middle" style={{ ...wordmark, fontStretch: "68%", letterSpacing: "-1px" }}>
              ORACK.
            </text>
          </g>
          <path transform={`translate(200 ${pos.starY})`} d={STAR} />
        </g>
      )}

      {print === "graphic" && (
        <g>
          <g transform={`translate(200 ${pos.globeY}) rotate(-16)`} fill="none" stroke={c.ink} strokeWidth="1.6">
            <ellipse cx="0" cy="0" rx="74" ry="40" />
            <ellipse cx="0" cy="0" rx="50" ry="40" />
            <ellipse cx="0" cy="0" rx="24" ry="40" />
            <line x1="0" y1="-40" x2="0" y2="40" />
            <ellipse cx="0" cy="0" rx="74" ry="14" />
            <path d="M-66 -18 Q0 -26 66 -18" />
            <path d="M-66 18 Q0 26 66 18" />
          </g>
          <text x="214" y={pos.globeTextY} fontSize="40" fill={c.ink} textAnchor="middle" style={{ ...wordmark, fontStretch: "68%" }}>
            ORACK.
          </text>
        </g>
      )}

      {print === "sleeve" && (
        <g transform={`translate(${pos.sleeveX} ${pos.sleeveY}) rotate(${pos.sleeveR})`}>
          <text x="0" y="0" fontSize="17" fill={c.ink} textAnchor="middle" style={wordmark}>
            ORACK.
          </text>
        </g>
      )}
    </svg>
  );
}
