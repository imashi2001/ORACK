import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getCategories, getProducts } from "@/features/products/queries";

const PAGES = ["", "/products", "/customize", "/about", "/help", "/size-guide", "/delivery-returns", "/contact", "/privacy", "/terms"];

/** sitemap.xml for search engines: storefront pages, categories and every active product. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return [
    ...PAGES.map((p) => ({ url: `${base}${p}`, changeFrequency: p === "" || p === "/products" ? ("daily" as const) : ("monthly" as const), priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/products?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
