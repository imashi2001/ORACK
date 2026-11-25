/**
 * Static storefront defaults. Business details (WhatsApp number, contact info,
 * social links, announcement) are edited in Admin → Settings; these values are
 * only used until that row exists.
 */
export const siteConfig = {
  name: "ORACK",
  tagline: "Wear your identity.",
  description:
    "Minimal black-and-white streetwear from Sri Lanka. Oversized tees, hoodies and custom prints. Order in minutes via WhatsApp.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  announcement: ["Islandwide delivery across Sri Lanka", "Order in minutes via WhatsApp", "Custom prints on request"],
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "T-Shirts", href: "/products?category=t-shirts" },
  { label: "Hoodies", href: "/products?category=hoodies" },
  { label: "New In", href: "/products?sort=newest" },
  { label: "Customize", href: "/customize" },
  { label: "About", href: "/#story" },
] as const;
