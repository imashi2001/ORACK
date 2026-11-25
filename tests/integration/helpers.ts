import { getPrisma } from "@/lib/prisma";

export const hasTestDb = !!process.env.TEST_DATABASE_URL;

/** Empties every table (fast, keeps the schema). */
export async function resetDb() {
  const prisma = getPrisma();
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

/** One category, one product (base price 2500) with two variants. */
export async function seedCatalog(opts: { stockM?: number; stockL?: number; productStatus?: "ACTIVE" | "INACTIVE"; customizable?: boolean } = {}) {
  const prisma = getPrisma();
  const category = await prisma.category.create({ data: { name: "T-Shirts", slug: "t-shirts" } });
  const product = await prisma.product.create({
    data: {
      name: "Test Tee",
      slug: "test-tee",
      description: "A tee for tests.",
      categoryId: category.id,
      basePrice: 2500,
      status: opts.productStatus ?? "ACTIVE",
      isCustomizable: opts.customizable ?? true,
      variants: {
        create: [
          { sku: "T-BLK-M", size: "M", colorName: "Black", colorHex: "#111111", stockQuantity: opts.stockM ?? 5 },
          { sku: "T-BLK-L", size: "L", colorName: "Black", colorHex: "#111111", stockQuantity: opts.stockL ?? 5, price: 2800 },
        ],
      },
    },
    include: { variants: true },
  });
  const m = product.variants.find((v) => v.size === "M")!;
  const l = product.variants.find((v) => v.size === "L")!;
  return { category, product, m, l };
}

export function uuid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}
