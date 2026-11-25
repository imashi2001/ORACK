import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Use a full https:// link")
  .optional();

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(60),
  whatsappNumber: z
    .string()
    .trim()
    .refine((v) => {
      const d = v.replace(/\D/g, "");
      return /^0\d{9}$/.test(d) || /^\d{10,15}$/.test(d);
    }, "Enter a number like 077 123 4567 or +94 77 123 4567"),
  contactEmail: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  deliveryInfo: z.string().trim().max(1000).optional(),
  announcementText: z.string().trim().max(300).optional(),
  announcementEnabled: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
