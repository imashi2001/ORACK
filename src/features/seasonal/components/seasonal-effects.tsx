"use client";

import { useEffect, useRef } from "react";
import { isSeasonLive, sriLankaToday, type SeasonalSettings } from "../config";
import { startParticles } from "../particles";

/**
 * Full-screen falling effect (snow, confetti…). Sits above the page but catches no clicks,
 * respects "reduce motion", and re-checks the schedule in the browser so it switches off on time.
 */
export function SeasonalEffects({ settings }: { settings: SeasonalSettings }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current || settings.effect === "none" || !isSeasonLive(settings, sriLankaToday())) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const phone = window.matchMedia("(max-width: 640px)").matches;
    if (phone && !settings.onMobile) return;
    // Lighter on phones.
    return startParticles(canvas.current, settings.effect, phone && settings.intensity === "heavy" ? "medium" : settings.intensity);
  }, [settings]);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45] size-full" />;
}
