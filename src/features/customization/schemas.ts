import { z } from "zod";
import { phoneSchema } from "@/features/orders/schemas";

// Defaults until the business decides final limits.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 5;

export const PLACEMENTS = [
  { value: "FRONT", label: "Front", note: "Centre chest" },
  { value: "BACK", label: "Back", note: "Large back print" },
  { value: "LEFT_SLEEVE", label: "Left sleeve", note: "Small sleeve mark" },
  { value: "RIGHT_SLEEVE", label: "Right sleeve", note: "Small sleeve mark" },
  { value: "OTHER", label: "Other", note: "Explain in instructions" },
] as const;

export const placementValues = PLACEMENTS.map((p) => p.value) as [string, ...string[]];

export const customizationFormSchema = z.object({
  productSlug: z.string().min(1, "Choose a product"),
  colorName: z.string().trim().min(1, "Choose a colour").max(60),
  size: z.string().trim().min(1, "Choose a size").max(10),
  quantity: z.number().int().min(1).max(500),
  placements: z.array(z.enum(placementValues)).min(1, "Choose at least one placement"),
  designDescription: z.string().trim().min(10, "Tell us a bit more about your design (at least 10 characters)").max(1000),
  additionalInstructions: z.string().trim().max(1000).optional(),
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  customerPhone: phoneSchema,
});

export type CustomizationFormValues = z.infer<typeof customizationFormSchema>;

export const submitCustomizationSchema = customizationFormSchema.extend({
  idempotencyKey: z.uuid(),
  images: z
    .array(
      z.object({
        name: z.string().max(200),
        type: z.enum(ALLOWED_IMAGE_TYPES),
        size: z.number().int().positive().max(MAX_IMAGE_BYTES),
      }),
    )
    .max(MAX_IMAGES),
});

export type SubmitCustomizationInput = z.infer<typeof submitCustomizationSchema>;

/** Step 1: request saved. `uploads` are presigned PUT URLs for each image, in the order sent. */
export type SubmitCustomizationResult =
  | { ok: true; requestId: string; reference: string; uploads: { index: number; uploadUrl: string }[]; imageStorageAvailable: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const finalizeCustomizationSchema = z.object({
  requestId: z.string().min(1).max(40),
  idempotencyKey: z.uuid(),
});

/** Step 2: uploads verified, WhatsApp message ready. */
export type FinalizeCustomizationResult =
  | { ok: true; reference: string; message: string; whatsappUrl: string; uploadedCount: number; failedCount: number }
  | { ok: false; error: string };
