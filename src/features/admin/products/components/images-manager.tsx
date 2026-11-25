"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StarIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { adminButton, adminInput, adminLabel, Badge, Card, FormError } from "@/features/admin/components/ui";
import { cn } from "@/lib/utils";
import { attachProductImage, deleteProductImage, requestProductImageUpload, setPrimaryImage } from "../actions";
import type { AdminProduct } from "../queries";
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from "../schemas";

export function ImagesManager({ product, storageReady }: { product: AdminProduct; storageReady: boolean }) {
  const router = useRouter();
  const colours = [...new Set(product.variants.map((v) => v.colorName))];
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState(product.name);
  const [colorName, setColorName] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = () => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) return setError("Use a JPG, PNG, WEBP or AVIF image.");
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) return setError("Images must be 8 MB or smaller.");

      setStatus("Preparing upload…");
      const signed = await requestProductImageUpload({ productId: product.id, fileName: file.name, contentType: file.type, size: file.size });
      if (!signed.ok || !signed.data) {
        setStatus(null);
        return setError(signed.ok ? "Upload failed." : signed.error);
      }
      setStatus("Uploading…");
      const put = await fetch(signed.data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) {
        setStatus(null);
        return setError("Upload to storage failed. Check the R2 CORS settings.");
      }
      setStatus("Saving…");
      const saved = await attachProductImage({ productId: product.id, objectKey: signed.data.objectKey, altText, colorName: colorName || null });
      setStatus(null);
      if (!saved.ok) return setError(saved.error);
      setFile(null);
      router.refresh();
    });
  };

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });

  return (
    <Card title="Photos" description="The primary photo is used on product cards. Without photos, the placeholder artwork is shown.">
      <div className="flex flex-col gap-5">
        {product.images.length > 0 && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {product.images.map((img) => (
              <li key={img.id} className="flex flex-col gap-2 border border-line p-2">
                <div className="relative aspect-[4/5] bg-mist">
                  <Image src={img.url} alt={img.altText} fill sizes="160px" className="object-cover" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {img.isPrimary && <Badge tone="dark">Primary</Badge>}
                  {img.colorName && <Badge>{img.colorName}</Badge>}
                </div>
                <div className="flex gap-1">
                  {!img.isPrimary && (
                    <button type="button" disabled={pending} onClick={() => act(() => setPrimaryImage(product.id, img.id))} className={adminButton({ variant: "secondary", size: "sm" })} aria-label="Make primary">
                      <StarIcon />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm("Delete this photo?") && act(() => deleteProductImage(product.id, img.id))}
                    className={adminButton({ variant: "danger", size: "sm" })}
                    aria-label="Delete photo"
                  >
                    <Trash2Icon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {storageReady ? (
          <div className="grid grid-cols-1 gap-4 border border-dashed border-line p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="flex flex-col gap-1.5">
              <span className={adminLabel}>Image file</span>
              <input type="file" accept={PRODUCT_IMAGE_TYPES.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm file:mr-3 file:h-9 file:border file:border-line file:bg-white file:px-3 file:text-sm file:font-semibold" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Alt text</span>
                <input className={adminInput} value={altText} onChange={(e) => setAltText(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>For colour</span>
                <select className={adminInput} value={colorName} onChange={(e) => setColorName(e.target.value)}>
                  <option value="">All colours</option>
                  {colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" disabled={!file || pending} onClick={upload} className={cn(adminButton({ size: "md" }))}>
              <UploadIcon /> {status ?? "Upload"}
            </button>
          </div>
        ) : (
          <p className="border border-dashed border-line bg-paper p-4 text-sm text-smoke">
            Photo uploads need Cloudflare R2. Set <code className="font-mono text-ink">R2_ACCOUNT_ID</code>, <code className="font-mono text-ink">R2_ACCESS_KEY_ID</code>,{" "}
            <code className="font-mono text-ink">R2_SECRET_ACCESS_KEY</code>, <code className="font-mono text-ink">R2_PUBLIC_BUCKET</code> and{" "}
            <code className="font-mono text-ink">R2_PUBLIC_BASE_URL</code>, then restart the app.
          </p>
        )}
        <FormError message={error} />
      </div>
    </Card>
  );
}
