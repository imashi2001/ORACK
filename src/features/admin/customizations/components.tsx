"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, SendIcon, XIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/shop/icons";
import { adminButton, adminInput, adminLabel, adminTextarea, Badge, Card, EmptyState, FormError } from "@/features/admin/components/ui";
import { CUSTOMIZATION_STATUSES, formatDate, formatDateTime, quotationStatusMeta } from "@/features/admin/labels";
import type { CustomizationStatus, QuotationStatus } from "@/generated/prisma/enums";
import { formatLKR } from "@/lib/format";
import { buildQuotationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { convertToOrder, createQuotation, markQuotationSent, recordQuotationDecision, updateCustomizationNotes, updateCustomizationStatus } from "./actions";

type Res = { ok: boolean; error?: string };

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = (fn: () => Promise<Res>, success?: string, after?: () => void) =>
    startTransition(async () => {
      setError(null);
      setDone(null);
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "Something went wrong.");
      if (success) setDone(success);
      after?.();
      router.refresh();
    });
  return { pending, error, done, run };
}

export function RequestStatusControl({ requestId, status }: { requestId: string; status: CustomizationStatus }) {
  const [next, setNext] = useState<CustomizationStatus>(status);
  const { pending, error, done, run } = useRun();
  const options = CUSTOMIZATION_STATUSES.filter((s) => s.value !== "CONVERTED_TO_ORDER" || status === "CONVERTED_TO_ORDER");
  return (
    <Card title="Request status" description="Quotation steps update this automatically.">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateCustomizationStatus(requestId, next), "Status updated.");
        }}
      >
        <select className={adminInput} value={next} onChange={(e) => setNext(e.target.value as CustomizationStatus)} aria-label="Request status">
          {options.map((s) => (
            <option key={s.value} value={s.value} disabled={s.value === "CONVERTED_TO_ORDER"}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending || next === status} className={adminButton({ size: "sm" })}>
            {pending ? "Saving…" : "Update status"}
          </button>
          {done && <span className="text-[13px] text-[#166534]">{done}</span>}
        </div>
        <FormError message={error} />
      </form>
    </Card>
  );
}

export function RequestNotesControl({ requestId, notes }: { requestId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? "");
  const { pending, error, done, run } = useRun();
  return (
    <Card title="Internal notes" description="Only visible to the ORACK team.">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateCustomizationNotes(requestId, value), "Notes saved.");
        }}
      >
        <textarea className={adminTextarea} rows={4} value={value} onChange={(e) => setValue(e.target.value)} aria-label="Internal notes" />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending || value === (notes ?? "")} className={adminButton({ variant: "secondary", size: "sm" })}>
            {pending ? "Saving…" : "Save notes"}
          </button>
          {done && <span className="text-[13px] text-[#166534]">{done}</span>}
        </div>
        <FormError message={error} />
      </form>
    </Card>
  );
}

export interface QuotationRow {
  id: string;
  version: number;
  unitPrice: number;
  quantity: number;
  setupFee: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  validUntil: Date | null;
  status: QuotationStatus;
  sentAt: Date | null;
  createdAt: Date;
  createdBy: { name: string } | null;
}

interface RequestSummary {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  colorName: string;
  size: string;
  quantity: number;
  closed: boolean;
}

export function QuotationsPanel({ request, quotations }: { request: RequestSummary; quotations: QuotationRow[] }) {
  const [formOpen, setFormOpen] = useState(quotations.length === 0 && !request.closed);
  const { pending, error, run } = useRun();
  // Only the newest live version can be sent or answered; older ones are history.
  const latestVersion = Math.max(0, ...quotations.filter((q) => q.status !== "EXPIRED").map((q) => q.version));

  return (
    <Card
      title="Quotations"
      description="Prepare a quote, send it on WhatsApp, then record the customer's answer."
      actions={
        !request.closed && !formOpen ? (
          <button type="button" className={adminButton({ size: "sm" })} onClick={() => setFormOpen(true)}>
            {quotations.length ? "New revision" : "Prepare quotation"}
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        {formOpen && <QuotationForm request={request} defaults={quotations[0]} onClose={() => setFormOpen(false)} />}
        <FormError message={error} />
        {quotations.length === 0 && !formOpen && <EmptyState title="No quotations yet" />}
        {quotations.map((q) => {
          const meta = quotationStatusMeta(q.status);
          const message = buildQuotationMessage({
            customerName: request.customerName,
            reference: request.reference,
            version: q.version,
            productName: request.productName,
            colorName: request.colorName,
            size: request.size,
            quantity: q.quantity,
            unitPrice: q.unitPrice,
            setupFee: q.setupFee,
            deliveryFee: q.deliveryFee,
            total: q.total,
            validUntil: q.validUntil ? formatDate(q.validUntil) : null,
            notes: q.notes,
          });
          const open = !request.closed && q.version === latestVersion && (q.status === "DRAFT" || q.status === "SENT");
          return (
            <div key={q.id} className={cn("border p-4", open ? "border-ink" : "border-line opacity-80")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Version {q.version}</span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <span className="text-xs text-smoke">
                  {formatDateTime(q.createdAt)} · {q.createdBy?.name ?? "—"}
                  {q.sentAt && ` · sent ${formatDateTime(q.sentAt)}`}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-smoke">Unit × qty</dt>
                  <dd>
                    {formatLKR(q.unitPrice)} × {q.quantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-smoke">Setup fee</dt>
                  <dd>{formatLKR(q.setupFee)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-smoke">Delivery</dt>
                  <dd>{formatLKR(q.deliveryFee)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-smoke">Total</dt>
                  <dd className="font-bold">{formatLKR(q.total)}</dd>
                </div>
              </dl>
              {(q.validUntil || q.notes) && (
                <p className="mt-2 text-sm text-graphite">
                  {q.validUntil && `Valid until ${formatDate(q.validUntil)}. `}
                  {q.notes}
                </p>
              )}
              {open && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={buildWhatsAppUrl(message, request.customerPhone)} target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "secondary", size: "sm" })}>
                    <WhatsAppIcon /> Open in WhatsApp
                  </a>
                  {q.status === "DRAFT" && (
                    <button type="button" disabled={pending} className={adminButton({ size: "sm" })} onClick={() => run(() => markQuotationSent(request.id, q.id))}>
                      <SendIcon /> Mark as sent
                    </button>
                  )}
                  {q.status === "SENT" && (
                    <>
                      <button type="button" disabled={pending} className={adminButton({ size: "sm" })} onClick={() => run(() => recordQuotationDecision(request.id, q.id, "ACCEPTED"))}>
                        <CheckIcon /> Customer accepted
                      </button>
                      <button type="button" disabled={pending} className={adminButton({ variant: "danger", size: "sm" })} onClick={() => run(() => recordQuotationDecision(request.id, q.id, "REJECTED"))}>
                        <XIcon /> Customer declined
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuotationForm({ request, defaults, onClose }: { request: RequestSummary; defaults?: QuotationRow; onClose: () => void }) {
  const [s, setS] = useState({
    unitPrice: defaults ? String(defaults.unitPrice) : "",
    quantity: String(defaults?.quantity ?? request.quantity),
    setupFee: String(defaults?.setupFee ?? 0),
    deliveryFee: String(defaults?.deliveryFee ?? 0),
    validUntil: "",
    notes: defaults?.notes ?? "",
  });
  const { pending, error, run } = useRun();
  const n = (v: string) => (v.trim() === "" ? NaN : Number(v));
  const total = (n(s.unitPrice) || 0) * (n(s.quantity) || 0) + (n(s.setupFee) || 0) + (n(s.deliveryFee) || 0);
  const field = (k: keyof typeof s, label: string, type = "number") => (
    <label className="flex flex-col gap-1.5">
      <span className={adminLabel}>{label}</span>
      <input type={type} min={0} step={type === "number" ? "0.01" : undefined} className={adminInput} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
    </label>
  );

  return (
    <form
      className="flex flex-col gap-4 border border-ink bg-paper p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            createQuotation(request.id, {
              unitPrice: n(s.unitPrice),
              quantity: n(s.quantity),
              setupFee: n(s.setupFee) || 0,
              deliveryFee: n(s.deliveryFee) || 0,
              validUntil: s.validUntil || null,
              notes: s.notes || undefined,
            }),
          undefined,
          onClose,
        );
      }}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {field("unitPrice", "Unit price (LKR)")}
        {field("quantity", "Quantity")}
        {field("setupFee", "Setup / print fee")}
        {field("deliveryFee", "Delivery fee")}
        {field("validUntil", "Valid until", "date")}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={adminLabel}>Note to customer (optional)</span>
        <input className={adminInput} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="e.g. Ready 7 working days after confirmation" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">
          Total: <strong>{formatLKR(total)}</strong>
        </span>
        <button type="submit" disabled={pending} className={adminButton({ size: "sm" })}>
          {pending ? "Saving…" : "Save draft quotation"}
        </button>
        <button type="button" onClick={onClose} className={adminButton({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
        <FormError message={error} />
      </div>
    </form>
  );
}

export function ConvertPanel({ requestId, order, canConvert }: { requestId: string; order: { id: string; reference: string } | null; canConvert: boolean }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (order) {
    return (
      <Card title="Order">
        <p className="text-sm">
          Converted to order{" "}
          <Link href={`/admin/orders/${order.id}`} className="font-mono font-semibold underline">
            {order.reference}
          </Link>
          . The original request is kept for reference.
        </p>
      </Card>
    );
  }
  if (!canConvert) {
    return (
      <Card title="Convert to order">
        <p className="text-sm text-smoke">Available once the customer has accepted a quotation.</p>
      </Card>
    );
  }
  return (
    <Card title="Convert to order" description="Creates a confirmed order from the accepted quotation. Stock isn't changed for custom prints.">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setError(null);
            const res = await convertToOrder(requestId, { deliveryAddress: address, note: note || undefined });
            if (!res.ok) return setError(res.error);
            if (res.data) router.push(`/admin/orders/${res.data.orderId}`);
          });
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Delivery address</span>
          <textarea className={adminTextarea} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="From the WhatsApp chat" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Order note (optional)</span>
          <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" disabled={pending} className={adminButton({ size: "sm" })}>
          {pending ? "Creating order…" : "Create order"}
        </button>
        <FormError message={error} />
      </form>
    </Card>
  );
}
