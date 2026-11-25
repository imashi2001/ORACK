import type { CustomizationStatus, OrderStatus, PaymentStatus, ProductStatus, QuotationStatus } from "@/generated/prisma/enums";

type Tone = "neutral" | "dark" | "amber" | "blue" | "green" | "red";

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: Tone }[] = [
  { value: "PENDING", label: "Pending", tone: "amber" },
  { value: "CONTACTED", label: "Contacted", tone: "blue" },
  { value: "CONFIRMED", label: "Confirmed", tone: "blue" },
  { value: "PROCESSING", label: "Processing", tone: "blue" },
  { value: "READY_FOR_DELIVERY", label: "Ready for delivery", tone: "blue" },
  { value: "DISPATCHED", label: "Dispatched", tone: "dark" },
  { value: "DELIVERED", label: "Delivered", tone: "green" },
  { value: "CANCELLED", label: "Cancelled", tone: "red" },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; tone: Tone }[] = [
  { value: "UNPAID", label: "Unpaid", tone: "neutral" },
  { value: "PAYMENT_PENDING", label: "Payment pending", tone: "amber" },
  { value: "PAID", label: "Paid", tone: "green" },
  { value: "REFUNDED", label: "Refunded", tone: "red" },
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string; tone: Tone }[] = [
  { value: "ACTIVE", label: "Active", tone: "green" },
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "INACTIVE", label: "Inactive", tone: "red" },
];

export const CUSTOMIZATION_STATUSES: { value: CustomizationStatus; label: string; tone: Tone }[] = [
  { value: "NEW_REQUEST", label: "New request", tone: "amber" },
  { value: "UNDER_REVIEW", label: "Under review", tone: "blue" },
  { value: "QUOTATION_PREPARED", label: "Quotation prepared", tone: "blue" },
  { value: "AWAITING_CUSTOMER_CONFIRMATION", label: "Awaiting customer", tone: "amber" },
  { value: "ACCEPTED", label: "Accepted", tone: "green" },
  { value: "REJECTED", label: "Rejected", tone: "red" },
  { value: "CONVERTED_TO_ORDER", label: "Converted to order", tone: "dark" },
  { value: "COMPLETED", label: "Completed", tone: "green" },
];

export const QUOTATION_STATUSES: { value: QuotationStatus; label: string; tone: Tone }[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "SENT", label: "Sent", tone: "blue" },
  { value: "ACCEPTED", label: "Accepted", tone: "green" },
  { value: "REJECTED", label: "Rejected", tone: "red" },
  { value: "EXPIRED", label: "Superseded", tone: "neutral" },
];

export function customizationStatusMeta(s: CustomizationStatus) {
  return CUSTOMIZATION_STATUSES.find((x) => x.value === s)!;
}
export function quotationStatusMeta(s: QuotationStatus) {
  return QUOTATION_STATUSES.find((x) => x.value === s)!;
}

export function orderStatusMeta(s: OrderStatus) {
  return ORDER_STATUSES.find((x) => x.value === s)!;
}
export function paymentStatusMeta(s: PaymentStatus) {
  return PAYMENT_STATUSES.find((x) => x.value === s)!;
}
export function productStatusMeta(s: ProductStatus) {
  return PRODUCT_STATUSES.find((x) => x.value === s)!;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" });

export function formatDateTime(d: Date | string) {
  return dateFmt.format(new Date(d));
}
export function formatDate(d: Date | string) {
  return dayFmt.format(new Date(d));
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
