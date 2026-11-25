"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, CheckIcon, ImageIcon, LockIcon, MinusIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { cta } from "@/components/shop/cta";
import { GarmentArt } from "@/features/products/components/garment-art";
import { DEFAULT_SIZES, type PrintStyle, type Product } from "@/features/products/types";
import { cn } from "@/lib/utils";
import { finalizeCustomizationRequest, submitCustomizationRequest } from "../actions";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  PLACEMENTS,
  customizationFormSchema,
  type CustomizationFormValues,
  type FinalizeCustomizationResult,
} from "../schemas";

type Success = Extract<FinalizeCustomizationResult, { ok: true }> & { imageStorageAvailable: boolean; requestedImages: number };

const field =
  "w-full border-[1.5px] border-input bg-white px-3.5 py-3 text-[15px] leading-normal text-ink outline-none transition-colors focus:border-ink aria-invalid:border-destructive";

const PREVIEW_PRINT: Record<string, PrintStyle> = { FRONT: "graphic", BACK: "back", LEFT_SLEEVE: "sleeve", RIGHT_SLEEVE: "sleeve", OTHER: "chest" };

export function CustomizeForm({ products, initialSlug }: { products: Product[]; initialSlug?: string }) {
  const initial = products.find((p) => p.slug === initialSlug) ?? products[0];
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<Success | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);

  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(customizationFormSchema),
    defaultValues: {
      productSlug: initial?.slug ?? "",
      colorName: initial?.colours[0]?.name ?? "",
      size: "M",
      quantity: 1,
      placements: ["FRONT"],
      designDescription: "",
      additionalInstructions: "",
      customerName: "",
      customerPhone: "",
    },
  });
  const { errors } = form.formState;
  const [slug, colorName, size, quantity, placements] = useWatch({ control: form.control, name: ["productSlug", "colorName", "size", "quantity", "placements"] });
  const product = products.find((p) => p.slug === slug) ?? initial;
  const colour = product?.colours.find((c) => c.name === colorName) ?? product?.colours[0];
  const sizeOptions = product?.sizes.length ? product.sizes : DEFAULT_SIZES;

  if (!product) return <p>No customizable products are available right now.</p>;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)) {
        setFileError(`${f.name}: only JPG, PNG or WEBP images are allowed.`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        setFileError(`${f.name} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        setFileError(`You can attach up to ${MAX_IMAGES} images.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    setServerError(null);
    startTransition(async () => {
      setProgress("Saving your request…");
      const saved = await submitCustomizationRequest({
        ...values,
        idempotencyKey: key,
        images: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      });
      if (!saved.ok) {
        setProgress(null);
        setServerError(saved.error);
        return;
      }

      // Upload straight to private storage. A failed upload doesn't lose the request;
      // the customer can still send images on WhatsApp.
      for (const [n, u] of saved.uploads.entries()) {
        const file = files[u.index];
        if (!file) continue;
        setProgress(`Uploading image ${n + 1} of ${saved.uploads.length}…`);
        await fetch(u.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } }).catch(() => undefined);
      }

      setProgress("Finishing up…");
      const done = await finalizeCustomizationRequest({ requestId: saved.requestId, idempotencyKey: key });
      setProgress(null);
      if (!done.ok) {
        setServerError(done.error);
        return;
      }
      setResult({ ...done, imageStorageAvailable: saved.imageStorageAvailable, requestedImages: files.length });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  if (result) {
    return (
      <SuccessView
        result={result}
        onRestart={() => {
          setResult(null);
          setFiles([]);
          setIdempotencyKey(null);
          form.reset();
        }}
      />
    );
  }

  const placementLabels = placements.map((v) => PLACEMENTS.find((p) => p.value === v)?.label ?? v).join(", ");

  return (
    <div className="flex flex-wrap items-start gap-[clamp(32px,5vw,64px)]">
      {/* Live preview */}
      <aside aria-label="Live preview" className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 lg:sticky lg:top-26">
        <div className="relative flex aspect-square items-center justify-center bg-[#131313] bg-[linear-gradient(#1f1f1f_1px,transparent_1px),linear-gradient(90deg,#1f1f1f_1px,transparent_1px)] bg-[size:36px_36px] p-[11%]">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(140,140,138,0.5),rgba(19,19,19,0)_62%)]" />
          <GarmentArt kind={product.kind} tone={colour?.tone ?? "black"} print={PREVIEW_PRINT[placements[0]] ?? "chest"} shadow={false} className="relative w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" />
          <span className="eyebrow absolute top-4.5 left-4.5 text-[#a3a3a3]">Live preview</span>
          <span className="eyebrow absolute top-4.5 right-4.5 text-white">{placementLabels || "No placement"}</span>
          <span className="eyebrow absolute bottom-4 left-4.5 text-[10px] text-[#8f8f8f]">Mock-up only · final artwork is confirmed with you</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 bg-white p-5">
          <Summary label="Product" value={product.name} />
          <Summary label="Colour" value={colorName} />
          <Summary label="Size × Qty" value={`${size} × ${quantity}`} />
          <Summary label="Images" value={String(files.length)} />
          <div className="col-span-2 flex justify-between gap-3 border-t border-[#ededea] pt-3.5">
            <dt className="eyebrow text-[10px] text-smoke">Price</dt>
            <dd className="text-sm font-semibold">Quoted on WhatsApp</dd>
          </div>
        </dl>
      </aside>

      {/* Form */}
      <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-11">
        <Section index="01" title="Choose your blank">
          <Controller
            control={form.control}
            name="productSlug"
            render={({ field: f }) => (
              <div role="radiogroup" aria-label="Product" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {products.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    role="radio"
                    aria-checked={f.value === p.slug}
                    onClick={() => {
                      f.onChange(p.slug);
                      if (!p.colours.some((c) => c.name === form.getValues("colorName"))) form.setValue("colorName", p.colours[0]?.name ?? "");
                      if (p.sizes.length && !p.sizes.includes(form.getValues("size"))) form.setValue("size", p.sizes[0]);
                    }}
                    className={cn("flex flex-col items-start gap-1.5 border-[1.5px] bg-white p-4 text-left", f.value === p.slug ? "border-ink shadow-[inset_0_0_0_1px_#0a0a0a]" : "border-[#d0d0cd] hover:border-ink")}
                  >
                    <span className="text-base font-bold">{p.name}</span>
                    <span className="text-[13px] text-smoke">{p.kind === "hoodie" ? "Hoodie" : "T-shirt"} · {p.colours.map((c) => c.name).join(", ")}</span>
                  </button>
                ))}
              </div>
            )}
          />

          <div className="mt-2 flex flex-wrap gap-x-10 gap-y-7">
            <Controller
              control={form.control}
              name="colorName"
              render={({ field: f }) => (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold">
                    Colour: <span className="font-normal">{f.value}</span>
                  </span>
                  <div role="radiogroup" aria-label="Colour" className="flex gap-3.5">
                    {product.colours.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        role="radio"
                        aria-checked={f.value === c.name}
                        aria-label={`${c.name} colour`}
                        onClick={() => f.onChange(c.name)}
                        style={{ backgroundColor: c.hex }}
                        className={cn("size-8 rounded-full border border-black/25", f.value === c.name && "shadow-[0_0_0_3px_#f3f3f1,0_0_0_4.5px_#0a0a0a]")}
                      />
                    ))}
                  </div>
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="quantity"
              render={({ field: f }) => (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold">Quantity</span>
                  <div className="inline-flex h-11.5 items-center self-start border-[1.5px] border-ink bg-white">
                    <button type="button" aria-label="Decrease quantity" disabled={f.value <= 1} onClick={() => f.onChange(f.value - 1)} className="flex h-full w-11 items-center justify-center disabled:opacity-40">
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="min-w-8 text-center font-bold" aria-live="polite">
                      {f.value}
                    </span>
                    <button type="button" aria-label="Increase quantity" disabled={f.value >= 500} onClick={() => f.onChange(f.value + 1)} className="flex h-full w-11 items-center justify-center disabled:opacity-40">
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="size"
            render={({ field: f }) => (
              <div className="mt-2 flex flex-col gap-3">
                <span className="text-sm font-semibold">Preferred size</span>
                <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={f.value === s}
                      onClick={() => f.onChange(s)}
                      className={cn("h-11.5 min-w-15 border-[1.5px] px-4.5 text-sm font-semibold", f.value === s ? "border-ink bg-ink text-white" : "border-[#d0d0cd] bg-white hover:border-ink")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="text-[13px] text-smoke">Ordering several sizes? Add the breakdown in your instructions below.</span>
              </div>
            )}
          />
        </Section>

        <Section index="02" title="Placement">
          <Controller
            control={form.control}
            name="placements"
            render={({ field: f }) => (
              <div role="group" aria-label="Placement (choose one or more)" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                {PLACEMENTS.map((p) => {
                  const on = f.value.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => f.onChange(on ? f.value.filter((v) => v !== p.value) : [...f.value, p.value])}
                      className={cn("flex flex-col items-start gap-1.5 border-[1.5px] bg-white p-4 text-left", on ? "border-ink shadow-[inset_0_0_0_1px_#0a0a0a]" : "border-[#d0d0cd] hover:border-ink")}
                    >
                      <span className="flex w-full items-center justify-between text-base font-bold">
                        {p.label} {on && <CheckIcon className="size-4" aria-hidden="true" />}
                      </span>
                      <span className="text-[13px] text-smoke">{p.note}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          <FieldError message={errors.placements?.message} />
        </Section>

        <Section index="03" title="Your design">
          <div className="flex flex-col gap-2">
            <label htmlFor="designDescription" className="text-sm font-semibold">
              Describe your design <span className="text-destructive">*</span>
            </label>
            <textarea
              id="designDescription"
              rows={4}
              placeholder="e.g. Our team name in bold letters across the back, small logo on the chest, white ink."
              className={cn(field, "resize-y")}
              aria-invalid={!!errors.designDescription}
              {...form.register("designDescription")}
            />
            <FieldError message={errors.designDescription?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">
              Reference images <span className="font-normal text-smoke">(optional)</span>
            </span>
            <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2.5 border-[1.5px] border-dashed border-[#9a9a97] bg-[#fafaf9] px-5 py-8 text-center transition-colors hover:border-ink hover:bg-white">
              <input
                type="file"
                multiple
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Upload reference images"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <UploadIcon className="size-8 stroke-[1.5]" aria-hidden="true" />
              <span className="text-[15px] font-semibold">Drop images here or browse</span>
              <span className="text-[13px] text-smoke">
                JPG, PNG or WEBP · up to {MAX_IMAGE_BYTES / 1024 / 1024} MB each · max {MAX_IMAGES} files
              </span>
            </label>
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 border border-[#e3e3e0] bg-white px-3.5 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <ImageIcon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span className="truncate text-sm">{f.name}</span>
                  <span className="eyebrow text-[10px] text-smoke">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-2">
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            <FieldError message={fileError ?? undefined} />
            <span className="flex items-center gap-2 text-[13px] text-smoke">
              <LockIcon className="size-3.5" aria-hidden="true" /> Stored privately. Only the ORACK team can view your images.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="additionalInstructions" className="text-sm font-semibold">
              Additional instructions <span className="font-normal text-smoke">(optional)</span>
            </label>
            <textarea id="additionalInstructions" rows={3} placeholder="Ink colours, size breakdown, deadline, anything else." className={cn(field, "resize-y")} {...form.register("additionalInstructions")} />
          </div>
        </Section>

        <Section index="04" title="Your details">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="customerName" className="text-sm font-semibold">
                Full name <span className="text-destructive">*</span>
              </label>
              <input id="customerName" autoComplete="name" className={field} aria-invalid={!!errors.customerName} {...form.register("customerName")} />
              <FieldError message={errors.customerName?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="customerPhone" className="text-sm font-semibold">
                WhatsApp number <span className="text-destructive">*</span>
              </label>
              <input id="customerPhone" type="tel" autoComplete="tel" placeholder="07X XXX XXXX" className={field} aria-invalid={!!errors.customerPhone} {...form.register("customerPhone")} />
              <FieldError message={errors.customerPhone?.message} />
            </div>
          </div>
        </Section>

        <div className="flex flex-col gap-3.5 border-t-2 border-ink pt-7">
          {serverError && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {serverError}
            </p>
          )}
          <button type="submit" disabled={pending} className={cta({ block: true, className: "min-h-14" })}>
            {pending ? (progress ?? "Sending…") : "Send request"} <ArrowRightIcon className="arrow" />
          </button>
          <p className="text-center text-[13px] leading-normal text-smoke">
            You&apos;ll get a request reference, then we&apos;ll open WhatsApp with your request written out. Our team replies with a quotation.
          </p>
        </div>
      </form>
    </div>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 flex items-baseline gap-3.5">
        <span className="eyebrow text-xs text-smoke">{index}</span>
        <span className="display text-[40px]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-[10px] text-smoke">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[13px] font-medium text-destructive">{message}</p> : null;
}

const NEXT_STEPS = [
  { title: "New request", body: "Saved with your reference. You are here." },
  { title: "Under review", body: "We check your design and references." },
  { title: "Quotation", body: "Pricing and timing sent on WhatsApp." },
  { title: "Your approval", body: "Accept the quote and it becomes an order." },
  { title: "Print & deliver", body: "Made for you and shipped islandwide." },
];

function SuccessView({ result, onRestart }: { result: Success; onRestart: () => void }) {
  return (
    <div className="flex flex-wrap items-start gap-[clamp(32px,5vw,64px)]">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-7">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink text-white">
          <CheckIcon className="size-7.5" aria-hidden="true" />
        </span>
        <h2 className="display text-[clamp(52px,6vw,88px)]">Request received.</h2>
        <p className="max-w-[560px] text-[17px] leading-relaxed text-graphite">
          Send it to us on WhatsApp so we can start reviewing. You&apos;ll receive a quotation there. This request is not an order, and you won&apos;t be charged unless you accept the quote.
        </p>
        <div className="flex max-w-[560px] items-center justify-between gap-4 border-[1.5px] border-ink bg-white px-5 py-4.5">
          <span className="eyebrow text-smoke">Request reference</span>
          <span className="font-mono text-lg">{result.reference}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className={cta({ className: "min-h-14" })}>
            Send on WhatsApp <ArrowRightIcon className="arrow" />
          </a>
          <button type="button" onClick={onRestart} className={cta({ tone: "outline-dark", className: "min-h-14" })}>
            New request
          </button>
        </div>
        <div className="flex max-w-[560px] flex-col gap-2.5">
          <span className="eyebrow text-smoke">Message preview</span>
          <pre className="border border-[#e3e3e0] bg-white p-4.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-[#1a1a1a]">{result.message}</pre>
        </div>
        {result.requestedImages > 0 && (result.failedCount > 0 || !result.imageStorageAvailable) && (
          <p role="status" className="max-w-[560px] border border-[#f3d9a4] bg-[#fff7e6] p-3.5 text-sm text-[#8a5300]">
            {result.uploadedCount > 0
              ? `${result.uploadedCount} of ${result.requestedImages} images uploaded. Please send the rest to us on WhatsApp.`
              : "We couldn't upload your images. Please attach them in the WhatsApp chat instead."}
          </p>
        )}
        {result.uploadedCount > 0 && result.failedCount === 0 && (
          <p className="max-w-[560px] text-sm text-smoke">
            {result.uploadedCount === 1 ? "1 reference image" : `${result.uploadedCount} reference images`} received privately.
          </p>
        )}
      </div>
      <aside aria-label="What happens next" className="min-w-0 flex-[1_1_360px] bg-ink p-8 text-white">
        <h3 className="display mb-6 text-4xl">What happens next</h3>
        <ol className="flex flex-col">
          {NEXT_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 border-t border-[#262626] py-3.5 last:border-b">
              <span className={cn("mt-1 size-3 shrink-0 rounded-full", i === 0 ? "bg-white" : "border-[1.5px] border-[#8f8f8f]")} aria-hidden="true" />
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="mt-0.5 text-sm text-[#a3a3a3]">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
