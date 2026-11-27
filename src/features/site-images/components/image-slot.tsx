"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImageIcon, RotateCcwIcon, UploadIcon } from "lucide-react";
import { adminButton, adminInput, Badge, FormError } from "@/features/admin/components/ui";
import { attachSiteImage, removeSiteImage, requestSiteImageUpload, updateSiteImageAlt } from "../actions";
import { MAX_SITE_IMAGE_BYTES, SITE_IMAGE_TYPES, type SiteImageView } from "../slots";

/** One replaceable storefront image: preview, upload/replace, remove (back to built-in artwork). */
export function ImageSlot({
  slot,
  label,
  hint,
  image,
  storageReady,
  aspect = "aspect-[4/3]",
  badge,
}: {
  slot: string;
  label: string;
  hint?: string;
  image: SiteImageView | null;
  storageReady: boolean;
  aspect?: string;
  badge?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState(image?.alt ?? "");

  const upload = (file: File) =>
    startTransition(async () => {
      setError(null);
      if (!(SITE_IMAGE_TYPES as readonly string[]).includes(file.type)) return setError("Use a JPG, PNG, WEBP or AVIF image.");
      if (file.size > MAX_SITE_IMAGE_BYTES) return setError("Images must be 12 MB or smaller.");
      setStatus("Preparing…");
      const signed = await requestSiteImageUpload({ slot, contentType: file.type, size: file.size });
      if (!signed.ok || !signed.data) {
        setStatus(null);
        return setError(signed.ok ? "Upload failed." : signed.error);
      }
      setStatus("Uploading…");
      const put = await fetch(signed.data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } }).catch(() => null);
      if (!put?.ok) {
        setStatus(null);
        return setError("Upload to storage failed. Check the R2 CORS settings.");
      }
      setStatus("Saving…");
      const saved = await attachSiteImage({ slot, objectKey: signed.data.objectKey, altText: alt || label });
      setStatus(null);
      if (!saved.ok) return setError(saved.error);
      router.refresh();
    });

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });

  return (
    <div className="flex flex-col gap-3 border border-line p-3">
      <div className={`relative ${aspect} overflow-hidden bg-paper`}>
        {image ? (
          <Image src={image.url} alt={image.alt} fill sizes="320px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-smoke">
            <ImageIcon className="size-6" aria-hidden="true" />
            <span className="text-xs">Using built-in artwork</span>
          </div>
        )}
        {badge && (
          <span className="absolute top-2 left-2">
            <Badge>{badge}</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs leading-relaxed text-smoke">{hint}</span>}
      </div>
      {image && (
        <div className="flex gap-1.5">
          <input aria-label={`${label} description`} className={adminInput} value={alt} maxLength={200} placeholder="Describe the photo" onChange={(e) => setAlt(e.target.value)} />
          {alt !== image.alt && (
            <button type="button" disabled={pending} onClick={() => act(() => updateSiteImageAlt(slot, alt))} className={adminButton({ size: "sm" })}>
              Save
            </button>
          )}
        </div>
      )}
      {storageReady ? (
        <div className="flex flex-wrap gap-1.5">
          <input
            ref={input}
            type="file"
            accept={SITE_IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) upload(f);
            }}
          />
          <button type="button" disabled={pending} onClick={() => input.current?.click()} className={adminButton({ size: "sm" })}>
            <UploadIcon /> {status ?? (image ? "Replace" : "Upload")}
          </button>
          {image && (
            <button
              type="button"
              disabled={pending}
              onClick={() => confirm("Remove this photo and go back to the built-in artwork?") && act(() => removeSiteImage(slot))}
              className={adminButton({ variant: "secondary", size: "sm" })}
            >
              <RotateCcwIcon /> Use artwork
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-smoke">Uploads need Cloudflare R2 configured.</p>
      )}
      <FormError message={error} />
    </div>
  );
}
