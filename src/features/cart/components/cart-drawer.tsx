"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cta } from "@/components/shop/cta";
import { GarmentArt } from "@/features/products/components/garment-art";
import { placeOrder } from "@/features/orders/actions";
import { checkoutDetailsSchema, type CheckoutDetails } from "@/features/orders/schemas";
import type { PlaceOrderResult } from "@/features/orders/types";
import { formatLKR } from "@/lib/format";
import { useCart, type CartLine } from "../cart-provider";

type Stage = "cart" | "checkout" | "done";
type Success = Extract<PlaceOrderResult, { ok: true }>;

const field =
  "w-full border-[1.5px] border-input bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-ink aria-invalid:border-destructive";

export function CartDrawer() {
  const { lines, count, subtotal, isOpen, setOpen, setQuantity, removeLine, clear } = useCart();
  const [stage, setStage] = useState<Stage>("cart");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [result, setResult] = useState<Success | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: { customerName: "", customerPhone: "", deliveryAddress: "", customerNote: "" },
  });

  const goToCheckout = () => {
    // One key per checkout attempt; resubmitting the same attempt reuses it.
    setIdempotencyKey((k) => k ?? crypto.randomUUID());
    setServerError(null);
    setStage("checkout");
  };

  const onSubmit = form.handleSubmit((details) => {
    if (!idempotencyKey) return;
    setServerError(null);
    startTransition(async () => {
      const res = await placeOrder({
        ...details,
        idempotencyKey,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      });
      if (!res.ok) {
        const stock = res.stockIssues?.map((s) => `${s.productName}: only ${s.available} left`).join(" · ");
        setServerError(stock ? `${res.error} ${stock}` : res.error);
        if (res.fieldErrors) {
          for (const [name, messages] of Object.entries(res.fieldErrors)) {
            if (name in details && messages?.[0]) form.setError(name as keyof CheckoutDetails, { message: messages[0] });
          }
        }
        return;
      }
      setResult(res);
      setStage("done");
      clear();
      form.reset();
      setIdempotencyKey(null);
    });
  });

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open && stage === "done") {
      setStage("cart");
      setResult(null);
    }
  };

  const title = stage === "checkout" ? "Checkout" : stage === "done" ? "Thank you" : "Your bag";

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="gap-0 bg-white p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[460px]">
        <div className="flex items-baseline gap-2.5 border-b border-[#e6e6e3] px-6 py-5 pr-14">
          <SheetTitle className="display text-[34px] text-ink">{title}</SheetTitle>
          {stage !== "done" && <span className="eyebrow text-smoke">{count === 1 ? "1 item" : `${count} items`}</span>}
        </div>
        <SheetDescription className="sr-only">Review your bag, check out and send your order on WhatsApp.</SheetDescription>

        {stage !== "done" && lines.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-10 text-center">
            <ShoppingBagIcon className="size-12 stroke-1" aria-hidden="true" />
            <p className="text-graphite">Your bag is empty.</p>
            <Link href="/products" className={cta()} onClick={() => setOpen(false)}>
              Shop the collection
            </Link>
          </div>
        )}

        {stage === "cart" && lines.length > 0 && (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-2">
              {lines.map((l) => (
                <CartLineRow key={l.variantId} line={l} onQty={(q) => setQuantity(l.variantId, q)} onRemove={() => removeLine(l.variantId)} />
              ))}
            </ul>
            <div className="flex flex-col gap-3 border-t border-[#e6e6e3] bg-[#fafaf9] px-6 pt-5 pb-6">
              <div className="flex justify-between text-[15px]">
                <span>Subtotal</span>
                <span className="font-bold">{formatLKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-graphite">
                <span>Delivery</span>
                <span>Confirmed on WhatsApp</span>
              </div>
              <button type="button" className={cta({ block: true, className: "mt-1.5" })} onClick={goToCheckout}>
                Checkout <ArrowRightIcon className="arrow" />
              </button>
              <p className="text-center text-xs text-smoke">Prices and stock are re-checked when you place your order.</p>
            </div>
          </>
        )}

        {stage === "checkout" && lines.length > 0 && (
          <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5">
              <button type="button" onClick={() => setStage("cart")} className="inline-flex items-center gap-2 self-start py-1.5 text-[13px] font-semibold">
                <ArrowLeftIcon className="size-3.5" /> Back to bag
              </button>
              <Field label="Full name" id="co-name" error={form.formState.errors.customerName?.message}>
                <input id="co-name" autoComplete="name" className={field} aria-invalid={!!form.formState.errors.customerName} {...form.register("customerName")} />
              </Field>
              <Field label="WhatsApp number" id="co-phone" error={form.formState.errors.customerPhone?.message}>
                <input id="co-phone" type="tel" autoComplete="tel" placeholder="07X XXX XXXX" className={field} aria-invalid={!!form.formState.errors.customerPhone} {...form.register("customerPhone")} />
              </Field>
              <Field label="Delivery address" id="co-address" error={form.formState.errors.deliveryAddress?.message}>
                <textarea id="co-address" rows={3} autoComplete="street-address" className={`${field} resize-y`} aria-invalid={!!form.formState.errors.deliveryAddress} {...form.register("deliveryAddress")} />
              </Field>
              <Field label="Note (optional)" id="co-note" error={form.formState.errors.customerNote?.message}>
                <input id="co-note" className={field} {...form.register("customerNote")} />
              </Field>

              <div className="flex flex-col gap-2 bg-paper p-4">
                <span className="eyebrow text-smoke">Order summary</span>
                {lines.map((l) => (
                  <div key={l.variantId} className="flex justify-between gap-3 text-sm">
                    <span>
                      {l.name} · {l.colorName} / {l.size} × {l.quantity}
                    </span>
                    <span className="whitespace-nowrap">{formatLKR(l.unitPrice * l.quantity)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-line pt-2.5 text-[15px] font-bold">
                  <span>Total</span>
                  <span>{formatLKR(subtotal)}</span>
                </div>
              </div>
              {serverError && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  {serverError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-[#e6e6e3] bg-[#fafaf9] px-6 pt-5 pb-6">
              <button type="submit" disabled={pending} className={cta({ block: true })}>
                {pending ? "Placing order…" : "Place order"}
              </button>
              <p className="text-center text-xs leading-relaxed text-smoke">
                You won&apos;t be charged now. We confirm stock, delivery and payment with you on WhatsApp.
              </p>
            </div>
          </form>
        )}

        {stage === "done" && result && (
          <>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-7">
              <span className="flex size-14 items-center justify-center rounded-full bg-ink text-white">
                <CheckIcon className="size-6.5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="display text-[44px]">Order received.</h3>
                <p className="text-[15px] leading-relaxed text-graphite">
                  One last step: send it to us on WhatsApp so we can confirm. Your order isn&apos;t confirmed until we reply.
                </p>
              </div>
              <div className="flex items-center justify-between border-[1.5px] border-ink p-4">
                <span className="eyebrow text-smoke">Order reference</span>
                <span className="font-mono text-base">{result.reference}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="eyebrow text-smoke">Message preview</span>
                <pre className="bg-paper p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-[#1a1a1a]">{result.message}</pre>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-t border-[#e6e6e3] bg-[#fafaf9] px-6 pt-5 pb-6">
              <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className={cta({ block: true })}>
                Send on WhatsApp <ArrowRightIcon className="arrow" />
              </a>
              <button type="button" className={cta({ tone: "outline-dark", block: true })} onClick={() => handleOpenChange(false)}>
                Continue shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

function CartLineRow({ line, onQty, onRemove }: { line: CartLine; onQty: (q: number) => void; onRemove: () => void }) {
  return (
    <li className="flex gap-4 border-b border-[#ededea] py-4.5">
      <Link href={`/products/${line.slug}`} className="relative flex aspect-[4/5] w-23 shrink-0 items-center justify-center overflow-hidden bg-[#efefec] p-2">
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt="" fill sizes="92px" className="object-cover" />
        ) : (
          <GarmentArt kind={line.kind} tone={line.tone} print={line.print} shadow={false} className="w-full" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex justify-between gap-2.5 text-[15px] font-semibold">
          <Link href={`/products/${line.slug}`}>{line.name}</Link>
          <span className="whitespace-nowrap">{formatLKR(line.unitPrice * line.quantity)}</span>
        </div>
        <span className="eyebrow text-smoke">
          {line.colorName} / {line.size}
        </span>
        <div className="mt-auto flex items-center justify-between">
          <div className="inline-flex items-center border-[1.5px] border-input">
            <button type="button" aria-label="Decrease quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={line.quantity <= 1} onClick={() => onQty(line.quantity - 1)}>
              <MinusIcon className="size-3.5" />
            </button>
            <span className="min-w-7 text-center text-sm font-semibold" aria-live="polite">
              {line.quantity}
            </span>
            <button type="button" aria-label="Increase quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={line.quantity >= Math.min(line.maxQuantity, 10)} onClick={() => onQty(line.quantity + 1)}>
              <PlusIcon className="size-3.5" />
            </button>
          </div>
          <button type="button" onClick={onRemove} className="py-2.5 text-[13px] text-graphite underline">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
