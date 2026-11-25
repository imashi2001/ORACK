"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminButton, adminInput, adminLabel, adminTextarea, Card, FormError } from "@/features/admin/components/ui";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/features/admin/labels";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { updateAdminNotes, updateDeliveryFee, updateOrderStatus, updatePaymentStatus } from "./actions";

type Result = { ok: true } | { ok: false; error: string };

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = (fn: () => Promise<Result | { ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      setError(null);
      setDone(null);
      const res = await fn();
      if (!res.ok) return setError(("error" in res && res.error) || "Something went wrong.");
      setDone(success);
      router.refresh();
    });
  return { pending, error, done, run };
}

export function StatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [next, setNext] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const { pending, error, done, run } = useAction();
  const cancelled = status === "CANCELLED";

  return (
    <Card title="Order status">
      {cancelled ? (
        <p className="text-sm text-smoke">This order was cancelled. Cancelled orders are final.</p>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (next === "CANCELLED" && !confirm("Cancel this order?")) return;
            run(() => updateOrderStatus(orderId, { status: next, note: note || undefined, restock }), "Status updated.");
            setNote("");
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>New status</span>
            <select className={adminInput} value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {next === "CANCELLED" && (
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-ink" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
              Return items to stock
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>Note (optional)</span>
            <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirmed with customer on WhatsApp" />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending || next === status} className={adminButton({ size: "sm", variant: next === "CANCELLED" ? "danger" : "primary" })}>
              {pending ? "Saving…" : "Update status"}
            </button>
            {done && <span className="text-[13px] text-[#166534]">{done}</span>}
          </div>
          <FormError message={error} />
        </form>
      )}
    </Card>
  );
}

export function PaymentControl({ orderId, paymentStatus }: { orderId: string; paymentStatus: PaymentStatus }) {
  const [next, setNext] = useState<PaymentStatus>(paymentStatus);
  const [note, setNote] = useState("");
  const { pending, error, done, run } = useAction();
  return (
    <Card title="Payment">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updatePaymentStatus(orderId, { paymentStatus: next, note: note || undefined }), "Payment updated.");
          setNote("");
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Payment status</span>
          <select className={adminInput} value={next} onChange={(e) => setNext(e.target.value as PaymentStatus)}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Note (optional)</span>
          <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bank transfer ref 12345" />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending || next === paymentStatus} className={adminButton({ size: "sm" })}>
            {pending ? "Saving…" : "Update payment"}
          </button>
          {done && <span className="text-[13px] text-[#166534]">{done}</span>}
        </div>
        <FormError message={error} />
      </form>
    </Card>
  );
}

export function DeliveryFeeControl({ orderId, deliveryFee, disabled }: { orderId: string; deliveryFee: number; disabled?: boolean }) {
  const [value, setValue] = useState(String(deliveryFee));
  const { pending, error, done, run } = useAction();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateDeliveryFee(orderId, Number(value)), "Saved.");
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className={adminLabel}>Delivery fee (LKR)</span>
        <input type="number" min={0} step="0.01" className={`${adminInput} h-9 w-32`} value={value} disabled={disabled} onChange={(e) => setValue(e.target.value)} />
      </label>
      <button type="submit" disabled={disabled || pending || Number(value) === deliveryFee} className={adminButton({ variant: "secondary", size: "sm" })}>
        {pending ? "Saving…" : "Set"}
      </button>
      {done && <span className="pb-2 text-[13px] text-[#166534]">{done}</span>}
      <FormError message={error} />
    </form>
  );
}

export function NotesControl({ orderId, notes }: { orderId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? "");
  const { pending, error, done, run } = useAction();
  return (
    <Card title="Internal notes" description="Only visible to the ORACK team.">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateAdminNotes(orderId, value), "Notes saved.");
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
