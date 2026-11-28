
/**
 * Static storefront defaults. Business details (WhatsApp number, contact info,
 * social links, announcement) are edited in Admin → Settings; these values fill
 * any field that hasn't been set there yet.
 */
export const siteConfig = {
  name: "ORACK",
  tagline: "Live Bold. Wear ORACK",
  description: "ORACK streetwear. Oversized tees and custom prints in black and white. Live Bold. Wear ORACK. Order in minutes via WhatsApp.",
  // Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://www.orackclothing.com). Falls back to Vercel's production domain, then localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94761889266",
  contactEmail: "onlyorack@gmail.com",
  social: {
    instagram: "https://www.instagram.com/orack.clothing",
    facebook: "https://www.facebook.com/share/1FoFXcPRoE/",
    tiktok: "https://www.tiktok.com/@orack42",
  },
  announcement: ["Islandwide delivery across Sri Lanka", "Order in minutes via WhatsApp", "Custom prints on request"],
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** A category as the menus show it. */
export interface NavCategory {
  slug: string;
  name: string;
  productCount: number;
  image?: { url: string; alt: string };
}

/**
 * Main navigation. Categories don't get a top-level link each (the bar would fill up as categories are added);
 * they live in the Shop menu instead, see SiteHeader.
 */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "New In", href: "/products?sort=newest" },
  { label: "Customize", href: "/customize" },
  { label: "About", href: "/about" },
];

export const SHOP_HREF = "/products";
