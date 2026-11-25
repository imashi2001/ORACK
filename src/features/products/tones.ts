import type { Tone } from "./types";

/** Maps any colour to the closest placeholder-artwork tone by perceived lightness. */
export function toneFromHex(hex: string): Tone {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "black";
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
  const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lightness > 0.8) return "white";
  if (lightness > 0.45) return "ash";
  if (lightness > 0.18) return "charcoal";
  return "black";
}
