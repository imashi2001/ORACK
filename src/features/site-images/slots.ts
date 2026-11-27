/** Fixed homepage image slots. Category cards use "category.<categoryId>". */
export const SITE_IMAGE_SLOTS = {
  "home.custom-tile": { label: "Custom designs card", hint: "The \"Custom designs\" card under the hero. Portrait or square photos work best." },
  "home.customize-band": { label: "Custom studio section", hint: "Replaces the T-shirt preview in the black \"Customize your T-shirt\" section. Square photo." },
  "home.story": { label: "Brand story", hint: "Shown in \"The ORACK story\" on the homepage and on the About page. Landscape photo." },
} as const;

export type FixedSlot = keyof typeof SITE_IMAGE_SLOTS;

export const categorySlot = (categoryId: string) => `category.${categoryId}`;

export function isFixedSlot(slot: string): slot is FixedSlot {
  return slot in SITE_IMAGE_SLOTS;
}

/** Slot names are also used in storage keys, so keep them to a safe shape. */
export function isValidSlotShape(slot: string): boolean {
  return isFixedSlot(slot) || /^category\.[a-z0-9]{8,40}$/.test(slot);
}

export const SITE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_SITE_IMAGE_BYTES = 12 * 1024 * 1024;

export interface SiteImageView {
  url: string;
  alt: string;
}
