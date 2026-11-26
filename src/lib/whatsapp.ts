import { formatLKR } from "@/lib/format";

/**
 * WhatsApp Click-to-Chat. Opening the link does NOT mean the message was sent:
 * the customer still has to press send, and the admin confirms manually.
 * `number` is the business WhatsApp number from settings (any format; digits are kept).
 */
export function buildWhatsAppUrl(message: string, number: string): string {
  const digits = toWhatsAppDigits(number);
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** "077 123 4567" / "+94 77…" / "9477…" → "9477…" (wa.me needs the international number without +). */
export function toWhatsAppDigits(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`;
  if (/^00/.test(digits)) return digits.slice(2);
  return digits;
}

/** "94761889266" → "+94 76 188 9266" for display. Other formats are shown as given. */
export function formatWhatsAppDisplay(number: string): string {
  const d = toWhatsAppDigits(number);
  const m = /^94(\d{2})(\d{3})(\d{4})$/.exec(d);
  return m ? `+94 ${m[1]} ${m[2]} ${m[3]}` : number;
}

export const generalEnquiryMessage = "Hi ORACK! I have a question.";

export interface OrderMessageInput {
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: { productName: string; colorName: string; size: string; quantity: number; lineTotal: number }[];
  total: number;
  note?: string | null;
}

export function buildOrderMessage(o: OrderMessageInput): string {
  return [
    "Hi ORACK, I'd like to confirm my order.",
    `Ref: ${o.reference}`,
    "",
    ...o.items.map((i) => `• ${i.productName} — ${i.colorName} / ${i.size} × ${i.quantity} — ${formatLKR(i.lineTotal)}`),
    "",
    `Total: ${formatLKR(o.total)} (delivery to be confirmed)`,
    `Name: ${o.customerName}`,
    `Phone: ${o.customerPhone}`,
    `Address: ${o.deliveryAddress}`,
    ...(o.note ? [`Note: ${o.note}`] : []),
  ].join("\n");
}

export interface CustomizationMessageInput {
  reference: string;
  customerName: string;
  productName: string;
  colorName: string;
  size: string;
  quantity: number;
  placements: string[];
  designDescription: string;
  additionalInstructions?: string;
  imageCount: number;
}

export function buildCustomizationMessage(c: CustomizationMessageInput): string {
  return [
    "Hi ORACK, I'd like a quote for a custom design.",
    `Ref: ${c.reference}`,
    "",
    `Product: ${c.productName} — ${c.colorName} / ${c.size} × ${c.quantity}`,
    `Placement: ${c.placements.join(", ")}`,
    `Design: ${c.designDescription}`,
    ...(c.additionalInstructions ? [`Notes: ${c.additionalInstructions}`] : []),
    `Reference images: ${c.imageCount}`,
    `Name: ${c.customerName}`,
  ].join("\n");
}

export interface QuotationMessageInput {
  customerName: string;
  reference: string;
  version: number;
  productName: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  setupFee: number;
  deliveryFee: number;
  total: number;
  validUntil?: string | null;
  notes?: string | null;
}

/** Sent by the admin to the customer. The customer replies in the chat; nothing is accepted automatically. */
export function buildQuotationMessage(q: QuotationMessageInput): string {
  return [
    `Hi ${q.customerName.split(" ")[0]}, here's your ORACK quotation for ${q.reference}${q.version > 1 ? ` (revision ${q.version})` : ""}:`,
    "",
    `• ${q.productName} — ${q.colorName} / ${q.size} × ${q.quantity} @ ${formatLKR(q.unitPrice)} = ${formatLKR(q.unitPrice * q.quantity)}`,
    ...(q.setupFee ? [`• Setup / print fee: ${formatLKR(q.setupFee)}`] : []),
    ...(q.deliveryFee ? [`• Delivery: ${formatLKR(q.deliveryFee)}`] : []),
    "",
    `Total: ${formatLKR(q.total)}`,
    ...(q.validUntil ? [`Valid until: ${q.validUntil}`] : []),
    ...(q.notes ? ["", q.notes] : []),
    "",
    "Reply to confirm and we'll start production.",
  ].join("\n");
}
