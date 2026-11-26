"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { adminButton, adminInput, adminLabel, Badge, Card, FormError } from "@/features/admin/components/ui";
import { cn } from "@/lib/utils";
import { attachHeroImage, deleteHeroSlide, moveHeroSlide, requestHeroUpload, updateHeroSlide } from "../actions";
import type { AdminHeroSlide } from "../queries";
import { HERO_FOCUS, HERO_IMAGE_TYPES, MAX_HERO_IMAGE_BYTES, MAX_HERO_SLIDES, type HeroFocus } from "../schemas";

const FOCUS_LABEL: Record<HeroFocus, string> = { center: "Centre", top: "Top", bottom: "Bottom", left: "Left", right: "Right" };

type Result = { ok: boolean; error?: string };

export function HeroManager({ slides, storageReady }: { slides: AdminHeroSlide[]; storageReady: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [focus, setFocus] = useState<HeroFocus>("center");
  const [monochrome, setMonochrome] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const room = MAX_HERO_SLIDES - slides.length;

  const upload = () => {
    if (!files.length) return;
    setError(null);
    startTransition(async () => {
      const batch = files.slice(0, room);
      for (const [n, file] of batch.entries()) {
        const label = batch.length > 1 ? ` ${n + 1}/${batch.length}` : "";
        if (!(HERO_IMAGE_TYPES as readonly string[]).includes(file.type)) return setError(`${file.name}: use a JPG, PNG, WEBP or AVIF image.`);
        if (file.size > MAX_HERO_IMAGE_BYTES) return setError(`${file.name}: images must be 12 MB or smaller.`);

        setStatus(`Preparing${label}…`);
        const signed = await requestHeroUpload({ fileName: file.name, contentType: file.type, size: file.size });
        if (!signed.ok || !signed.data) {
          setStatus(null);
          return setError(signed.ok ? "Upload failed." : signed.error);
        }
        setStatus(`Uploading${label}…`);
        const put = await fetch(signed.data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } }).catch(() => null);
        if (!put?.ok) {
          setStatus(null);
          return setError("Upload to storage failed. Check the R2 CORS settings.");
        }
        setStatus(`Saving${label}…`);
        const saved = await attachHeroImage({ objectKey: signed.data.objectKey, altText: "ORACK streetwear", focus, monochrome });
        if (!saved.ok) {
          setStatus(null);
          return setError(saved.error);
        }
      }
      setStatus(null);
      setFiles([]);
      router.refresh();
    });
  };

  const act = (fn: () => Promise<Result>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });

  return (
    <Card
      title="Hero images"
      description={`Full-width photos at the top of the homepage. They rotate every few seconds in this order. Landscape photos at least 2400 px wide work best. Up to ${MAX_HERO_SLIDES}.`}
    >
      <div className="flex flex-col gap-5">
        {slides.length === 0 && <p className="border border-dashed border-line bg-paper p-4 text-sm text-smoke">No hero images yet. The homepage shows the built-in black hero until you upload one.</p>}

        {slides.length > 0 && (
          <ol className="flex flex-col gap-3">
            {slides.map((s, i) => (
              <SlideRow key={s.id} slide={s} index={i} last={i === slides.length - 1} pending={pending} act={act} />
            ))}
          </ol>
        )}

        {storageReady ? (
          room > 0 ? (
            <div className="grid grid-cols-1 gap-4 border border-dashed border-line p-4 md:grid-cols-[1fr_160px_auto_auto] md:items-end">
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Image files</span>
                <input
                  type="file"
                  multiple
                  accept={HERO_IMAGE_TYPES.join(",")}
                  onChange={(e) => setFiles([...(e.target.files ?? [])])}
                  className="text-sm file:mr-3 file:h-9 file:border file:border-line file:bg-white file:px-3 file:text-sm file:font-semibold"
                />
                {files.length > room && <span className="text-xs text-smoke">Only the first {room} will be added.</span>}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Keep in frame</span>
                <select className={adminInput} value={focus} onChange={(e) => setFocus(e.target.value as HeroFocus)}>
                  {HERO_FOCUS.map((f) => (
                    <option key={f} value={f}>
                      {FOCUS_LABEL[f]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 text-sm font-semibold text-ink">
                <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} className="size-4 accent-ink" />
                Black &amp; white
              </label>
              <button type="button" disabled={!files.length || pending} onClick={upload} className={adminButton({ size: "md" })}>
                <UploadIcon /> {status ?? "Upload"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-smoke">You have {MAX_HERO_SLIDES} hero images, the maximum. Delete one to add another.</p>
          )
        ) : (
          <p className="border border-dashed border-line bg-paper p-4 text-sm text-smoke">
            Hero uploads need Cloudflare R2. Set the <code className="font-mono text-ink">R2_*</code> variables, then redeploy.
          </p>
        )}
        <FormError message={error} />
      </div>
    </Card>
  );
}

function SlideRow({ slide, index, last, pending, act }: { slide: AdminHeroSlide; index: number; last: boolean; pending: boolean; act: (fn: () => Promise<Result>) => void }) {
  const [altText, setAltText] = useState(slide.altText);
  const [focus, setFocus] = useState(slide.focus as HeroFocus);
  const [monochrome, setMonochrome] = useState(slide.monochrome);
  const dirty = altText !== slide.altText || focus !== slide.focus || monochrome !== slide.monochrome;
  const save = (isActive = slide.isActive) => act(() => updateHeroSlide(slide.id, { altText, focus, monochrome, isActive }));

  return (
    <li className="grid grid-cols-1 gap-4 border border-line p-3 sm:grid-cols-[220px_1fr]">
      <div className="relative aspect-[16/9] overflow-hidden bg-ink">
        <Image src={slide.url} alt={slide.altText} fill sizes="220px" className={cn("object-cover", monochrome && "grayscale")} style={{ objectPosition: focus }} />
        <span className="absolute top-2 left-2 bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink">0{index + 1}</span>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">{slide.isActive ? <Badge tone="dark">Showing</Badge> : <Badge>Hidden</Badge>}</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_150px_auto] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>Description (for screen readers)</span>
            <input className={adminInput} value={altText} maxLength={200} onChange={(e) => setAltText(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>Keep in frame</span>
            <select className={adminInput} value={focus} onChange={(e) => setFocus(e.target.value as HeroFocus)}>
              {HERO_FOCUS.map((f) => (
                <option key={f} value={f}>
                  {FOCUS_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} className="size-4 accent-ink" />
            Black &amp; white
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dirty && (
            <button type="button" disabled={pending} onClick={() => save()} className={adminButton({ size: "sm" })}>
              Save changes
            </button>
          )}
          <button type="button" disabled={pending || index === 0} onClick={() => act(() => moveHeroSlide(slide.id, "up"))} className={adminButton({ variant: "secondary", size: "sm" })} aria-label="Move earlier">
            <ArrowUpIcon />
          </button>
          <button type="button" disabled={pending || last} onClick={() => act(() => moveHeroSlide(slide.id, "down"))} className={adminButton({ variant: "secondary", size: "sm" })} aria-label="Move later">
            <ArrowDownIcon />
          </button>
          <button type="button" disabled={pending} onClick={() => save(!slide.isActive)} className={adminButton({ variant: "secondary", size: "sm" })}>
            {slide.isActive ? <EyeOffIcon /> : <EyeIcon />} {slide.isActive ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => confirm("Delete this hero image?") && act(() => deleteHeroSlide(slide.id))}
            className={adminButton({ variant: "danger", size: "sm" })}
            aria-label="Delete hero image"
          >
            <Trash2Icon />
          </button>
        </div>
      </div>
    </li>
  );
}
