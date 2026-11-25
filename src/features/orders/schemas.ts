import { z } from "zod";
import { normaliseSriLankanMobile } from "@/lib/format";

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normaliseSriLankanMobile(v) !== null, "Enter a valid Sri Lankan mobile number, e.g. 077 123 4567");

/** Fields the customer fills in at checkout (shared by the form and the server action). */
export const checkoutDetailsSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  customerPhone: phoneSchema,
  deliveryAddress: z.string().trim().min(10, "Please enter your full delivery address").max(300),
  customerNote: z.string().trim().max(300).optional(),
});

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

/** What the client sends. Only IDs and quantities — never prices. */
export const placeOrderSchema = checkoutDetailsSchema.extend({
  idempotencyKey: z.uuid(),
  items: z
    .array(z.object({ variantId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Your bag is empty")
    .max(20),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
