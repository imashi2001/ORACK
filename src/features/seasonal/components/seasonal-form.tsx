"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { adminButton, adminInput, adminLabel, Badge, Card, FormError } from "@/features/admin/components/ui";
import { cn } from "@/lib/utils";
import { saveSeasonal } from "../actions";
import { EFFECTS, INTENSITIES, isSeasonLive, LIGHTS, PRESET_INFO, PRESETS, sriLankaToday, type Effect, type SeasonalSettings } from "../config";
import { startParticles } from "../particles";
import { StringLights } from "./string-lights";

const EFFECT_LABEL: Record<Effect, string> = { none: "None", snow: "Falling snow", confetti: "Confetti", hearts: "Floating hearts", sparkles: "Twinkling sparkles" };
const LIGHTS_LABEL = { off: "Off", warm: "Warm white", colour: "Colourful" } as const;
const INTENSITY_LABEL = { light: "Light", medium: "Medium", heavy: "Heavy" } as const;

export function SeasonalForm({ initial }: { initial: SeasonalSettings }) {
  const [s, setS] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SeasonalSettings>(initial);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = <K extends keyof SeasonalSettings>(k: K, v: SeasonalSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const liveNow = isSeasonLive(saved, sriLankaToday());

  const applyPreset = (preset: SeasonalSettings["preset"]) => setS((p) => ({ ...p, preset, ...PRESET_INFO[preset].defaults }));

  const save = (next = s) =>
    startTransition(async () => {
      setError(null);
      setErrors({});
      const res = await saveSeasonal(next);
      if (!res.ok) {
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
        return;
      }
      setS(next);
      setSaved(next);
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-6">
        <Card
          title="Status"
          actions={liveNow ? <Badge tone="green">Showing on the store</Badge> : saved.enabled ? <Badge tone="amber">Scheduled</Badge> : <Badge>Off</Badge>}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-graphite">
              {saved.enabled
                ? liveNow
                  ? "Decorations are live. They switch off automatically after the end date, or turn them off now."
                  : "Decorations are on and will appear when the start date arrives."
                : "Decorations are off. Pick a theme below, check the preview, then switch them on."}
            </p>
            <button type="button" disabled={pending} onClick={() => save({ ...s, enabled: !saved.enabled })} className={adminButton({ variant: saved.enabled ? "secondary" : "primary" })}>
              {saved.enabled ? "Turn decorations off" : "Turn decorations on"}
            </button>
          </div>
        </Card>

        <Card title="Theme" description="Start from a preset, then adjust anything below.">
          <div role="group" aria-label="Preset" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={s.preset === p}
                onClick={() => applyPreset(p)}
                className={cn("flex flex-col items-center gap-1.5 border-[1.5px] px-3 py-4 text-sm font-semibold transition-colors", s.preset === p ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
              >
                <span aria-hidden="true" className="text-2xl">
                  {PRESET_INFO[p].emoji}
                </span>
                {PRESET_INFO[p].label}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Decorations">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Falling effect</span>
              <select className={adminInput} value={s.effect} onChange={(e) => set("effect", e.target.value as Effect)}>
                {EFFECTS.map((e) => (
                  <option key={e} value={e}>
                    {EFFECT_LABEL[e]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Amount</span>
              <select className={adminInput} value={s.intensity} disabled={s.effect === "none"} onChange={(e) => set("intensity", e.target.value as SeasonalSettings["intensity"])}>
                {INTENSITIES.map((i) => (
                  <option key={i} value={i}>
                    {INTENSITY_LABEL[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>String lights under the menu</span>
              <select className={adminInput} value={s.lights} onChange={(e) => set("lights", e.target.value as SeasonalSettings["lights"])}>
                {LIGHTS.map((l) => (
                  <option key={l} value={l}>
                    {LIGHTS_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2.5 text-sm md:col-span-3">
              <input type="checkbox" className="size-4 accent-ink" checked={s.onMobile} onChange={(e) => set("onMobile", e.target.checked)} />
              Show the falling effect on phones too
            </label>
          </div>
        </Card>

        <Card title="Banner" description="A message strip at the very top of every page.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_220px]">
            <label className="flex items-center gap-2.5 text-sm md:col-span-2">
              <input type="checkbox" className="size-4 accent-ink" checked={s.bannerEnabled} onChange={(e) => set("bannerEnabled", e.target.checked)} />
              Show a seasonal banner
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Message</span>
              <input className={adminInput} value={s.bannerText} maxLength={120} disabled={!s.bannerEnabled} onChange={(e) => set("bannerText", e.target.value)} />
              <FormError message={errors.bannerText?.[0]} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Link (optional)</span>
              <input className={adminInput} value={s.bannerLink} placeholder="/products" disabled={!s.bannerEnabled} onChange={(e) => set("bannerLink", e.target.value)} />
              <FormError message={errors.bannerLink?.[0]} />
            </label>
          </div>
        </Card>

        <Card title="Schedule" description="Optional. Leave both empty to keep decorations on until you switch them off. Dates are Sri Lanka time and include both days.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Start</span>
              <input type="date" className={adminInput} value={s.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>End</span>
              <input type="date" className={adminInput} value={s.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
              <FormError message={errors.endsOn?.[0]} />
            </label>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" disabled={pending || !dirty} onClick={() => save()} className={adminButton({ size: "md" })}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          {!dirty && !pending && <span className="text-sm text-smoke">All changes saved.</span>}
          <FormError message={error} />
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Card title="Preview">
          <Preview s={s} />
        </Card>
      </div>
    </div>
  );
}

/** A small mock storefront running the chosen decorations. */
function Preview({ s }: { s: SeasonalSettings }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current || s.effect === "none") return;
    return startParticles(canvas.current, s.effect, s.intensity);
  }, [s.effect, s.intensity]);

  return (
    <div className="relative overflow-hidden border border-line bg-paper" aria-label="Preview of the decorations">
      {s.bannerEnabled && s.bannerText && (
        <div className="bg-ink px-3 py-2 text-center text-[11px] font-semibold text-white">
          {PRESET_INFO[s.preset].emoji} {s.bannerText}
        </div>
      )}
      <div className="relative z-10 flex h-11 items-center justify-between bg-ink px-3 text-[11px] font-semibold tracking-[0.2em] text-white">
        ORACK
        <span className="flex gap-3 text-white/60">
          <span>SHOP</span>
          <span>CUSTOM</span>
        </span>
        {s.lights !== "off" && <StringLights mode={s.lights} />}
      </div>
      <div className="relative h-72 bg-[linear-gradient(160deg,#2b2b2a,#0a0a0a)]">
        <div className="absolute bottom-6 left-4 text-white">
          <div className="street text-4xl leading-none">LIVE BOLD.</div>
          <div className="street text-4xl leading-none">WEAR ORACK.</div>
        </div>
      </div>
      <div className="grid h-24 grid-cols-3 gap-2 p-3">
        <div className="bg-mist" />
        <div className="bg-mist" />
        <div className="bg-mist" />
      </div>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 size-full" />
    </div>
  );
}
