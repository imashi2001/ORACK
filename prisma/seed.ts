/**
 * Seeds categories, sample products and default business settings.
 * Safe to re-run: everything is upserted by slug / SKU.
 *   npx prisma db seed
 * Prices for the first four products come from the original mock-up; the rest are placeholders.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const COLOURS = {
  black: { name: "Black", hex: "#111111" },
  white: { name: "White", hex: "#f4f4f2" },
  ash: { name: "Ash", hex: "#a6a6a3" },
  charcoal: { name: "Charcoal", hex: "#454545" },
} as const;
type ColourKey = keyof typeof COLOURS;

const SIZES = ["S", "M", "L", "XL", "XXL"];
// Deterministic sample stock so the shop shows in-stock, low-stock and sold-out states.
const STOCK = [8, 12, 2, 6, 0, 5, 0, 9, 4, 3, 1, 7];

const PRODUCTS: {
  slug: string; name: string; category: "t-shirts" | "hoodies"; price: number; colours: ColourKey[]; artPrint: string;
  featured?: boolean; newArrival?: boolean; customizable?: boolean; sku: string; description: string;
}[] = [
  { slug: "classic-oversized-tee", name: "Classic Oversized Tee", category: "t-shirts", price: 2500, colours: ["black", "white", "charcoal"], artPrint: "chest", featured: true, customizable: true, sku: "CLT",
    description: "The everyday ORACK tee. Boxy, oversized fit with dropped shoulders and a small logo on the chest." },
  { slug: "signature-logo-tee", name: "Signature Logo Tee", category: "t-shirts", price: 2700, colours: ["white", "black", "charcoal"], artPrint: "back", featured: true, customizable: true, sku: "SIG",
    description: "Our signature oversized tee with the ORACK. star mark printed large across the back and a small logo on the chest." },
  { slug: "essential-hoodie", name: "Essential Hoodie", category: "hoodies", price: 4900, colours: ["black", "charcoal", "white"], artPrint: "chest", featured: true, customizable: true, sku: "ESH",
    description: "A relaxed hoodie with room to layer, kangaroo pocket and a clean chest logo." },
  { slug: "minimal-hoodie", name: "Minimal Hoodie", category: "hoodies", price: 4700, colours: ["white", "ash", "black"], artPrint: "chest", featured: true, sku: "MNH",
    description: "Minimal by design. A soft, relaxed hoodie with a tonal chest mark." },
  { slug: "globe-graphic-tee", name: "Globe Graphic Tee", category: "t-shirts", price: 3200, colours: ["charcoal", "black", "white"], artPrint: "graphic", newArrival: true, sku: "GLB",
    description: "Wireframe globe graphic on the front with the ORACK. wordmark." },
  { slug: "star-back-print-tee", name: "Star Back Print Tee", category: "t-shirts", price: 2900, colours: ["black", "ash"], artPrint: "back", newArrival: true, customizable: true, sku: "STR",
    description: "Large back print with the ORACK. star. Black or ash." },
  { slug: "ash-heavy-hoodie", name: "Ash Heavy Hoodie", category: "hoodies", price: 5200, colours: ["ash", "black"], artPrint: "chest", newArrival: true, sku: "ASH",
    description: "A heavier hoodie in ash marl with a bold chest logo." },
  { slug: "sleeve-mark-tee", name: "Sleeve Mark Tee", category: "t-shirts", price: 2600, colours: ["white", "black", "ash"], artPrint: "sleeve", newArrival: true, customizable: true, sku: "SLV",
    description: "Clean front, with the ORACK. mark on the left sleeve." },
];

async function main() {
  const categories = {
    "t-shirts": await prisma.category.upsert({
      where: { slug: "t-shirts" },
      update: {},
      create: { slug: "t-shirts", name: "T-Shirts", description: "Essential fits for every style.", sortOrder: 1 },
    }),
    hoodies: await prisma.category.upsert({
      where: { slug: "hoodies" },
      update: {},
      create: { slug: "hoodies", name: "Hoodies", description: "Premium comfort. Street-ready.", sortOrder: 2 },
    }),
  };

  for (const [i, p] of PRODUCTS.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: categories[p.category].id,
        basePrice: p.price,
        status: "ACTIVE",
        isFeatured: !!p.featured,
        isNewArrival: !!p.newArrival,
        isCustomizable: !!p.customizable,
        artPrint: p.artPrint,
        // Stagger creation dates so "newest" sorting is meaningful.
        createdAt: new Date(Date.UTC(2026, 9, 1 + i * 6)),
      },
    });

    for (const [c, key] of p.colours.entries()) {
      for (const [s, size] of SIZES.entries()) {
        const sku = `ORK-${p.sku}-${key.slice(0, 3).toUpperCase()}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            size,
            colorName: COLOURS[key].name,
            colorHex: COLOURS[key].hex,
            stockQuantity: STOCK[(i * 2 + c * SIZES.length + s) % STOCK.length],
          },
        });
      }
    }
  }

  await prisma.businessSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "ORACK",
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
      announcementText: "Islandwide delivery across Sri Lanka · Order in minutes via WhatsApp · Custom prints on request",
      announcementEnabled: true,
    },
  });

  console.log(`Seeded ${PRODUCTS.length} products in 2 categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
