
/**
 * Static storefront defaults. Business details (WhatsApp number, contact info,
 * social links, announcement) are edited in Admin → Settings; these values fill
 * any field that hasn't been set there yet.
 */
export const siteConfig = {
  name: "ORACK",
  tagline: "Live Bold. Wear ORACK",
  description: "ORACK streetwear. Oversized tees, hoodies and custom prints in black and white. Live Bold. Wear ORACK. Order in minutes via WhatsApp.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94761889266",
  contactEmail: "onlyorack@gmail.com",
  social: {
    instagram: "https://www.instagram.com/orack.clothing",
    facebook: "https://www.facebook.com/share/1FoFXcPRoE/",
    tiktok: "https://www.tiktok.com/@orack42",
  },
  announcement: ["Islandwide delivery across Sri Lanka", "Order in minutes via WhatsApp", "Custom prints on request"],
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "T-Shirts", href: "/products?category=t-shirts" },
  { label: "Hoodies", href: "/products?category=hoodies" },
  { label: "New In", href: "/products?sort=newest" },
  { label: "Customize", href: "/customize" },
  { label: "About", href: "/about" },
] as const;
