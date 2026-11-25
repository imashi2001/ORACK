"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminButton, adminInput, adminLabel, adminTextarea, Card, FormError } from "@/features/admin/components/ui";
import { cn } from "@/lib/utils";
import { saveSettings } from "./actions";
import { settingsSchema, type SettingsInput } from "./schemas";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setSaved(false);
      setServerError(null);
      const res = await saveSettings(values);
      if (!res.ok) {
        setServerError(res.error);
        for (const [k, v] of Object.entries(res.fieldErrors ?? {})) if (v?.[0]) form.setError(k as keyof SettingsInput, { message: v[0] });
        return;
      }
      setSaved(true);
    }),
  );

  const field = (name: keyof SettingsInput, label: string, opts: { hint?: string; type?: string; textarea?: boolean; className?: string; placeholder?: string } = {}) => (
    <div className={cn("flex flex-col gap-1.5", opts.className)}>
      <label htmlFor={name} className={adminLabel}>
        {label}
      </label>
      {opts.textarea ? (
        <textarea id={name} rows={3} className={adminTextarea} placeholder={opts.placeholder} aria-invalid={!!errors[name]} {...form.register(name)} />
      ) : (
        <input id={name} type={opts.type ?? "text"} className={adminInput} placeholder={opts.placeholder} aria-invalid={!!errors[name]} {...form.register(name)} />
      )}
      {errors[name]?.message ? <FormError message={errors[name]?.message} /> : opts.hint && <p className="text-xs text-smoke">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card title="Business">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {field("businessName", "Business name")}
          {field("whatsappNumber", "WhatsApp Business number", { hint: "Orders and custom requests are sent to this number.", placeholder: "077 123 4567" })}
          {field("contactEmail", "Contact email", { type: "email" })}
          {field("contactPhone", "Contact phone")}
          {field("address", "Address", { textarea: true, className: "md:col-span-2" })}
        </div>
      </Card>

      <Card title="Delivery">
        {field("deliveryInfo", "Delivery & returns information", {
          textarea: true,
          hint: "Shown on product pages and in the footer, e.g. delivery fees, timing and return policy.",
        })}
      </Card>

      <Card title="Announcement bar">
        <div className="flex flex-col gap-4">
          {field("announcementText", "Text", { hint: "Separate several messages with a middle dot ( · )." })}
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-4 accent-ink" {...form.register("announcementEnabled")} />
            Show the announcement bar
          </label>
        </div>
      </Card>

      <Card title="Social media">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {field("instagramUrl", "Instagram", { placeholder: "https://instagram.com/…" })}
          {field("tiktokUrl", "TikTok", { placeholder: "https://tiktok.com/@…" })}
          {field("facebookUrl", "Facebook", { placeholder: "https://facebook.com/…" })}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={adminButton()}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-[#166534]">Saved. The store is updated.</span>}
        <FormError message={serverError} />
      </div>
    </form>
  );
}
