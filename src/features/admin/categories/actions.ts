"use server";

import { refreshStorefront } from "@/features/products/refresh";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/features/admin/activity";
import type { ActionResult } from "@/features/admin/labels";
import { SLUG_RE } from "@/features/admin/products/schemas";
import { authorizeAction, CATALOG_ROLES } from "@/features/auth/dal";
import { CATALOG_TAG } from "@/features/products/queries";
import { getPrisma } from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  slug: z.string().trim().min(2).max(60).regex(SLUG_RE, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(300).optional(),
  tagline: z.string().trim().max(80).optional(),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const data = { ...parsed.data, description: parsed.data.description || null, tagline: parsed.data.tagline || null };
  try {
    const cat = id ? await getPrisma().category.update({ where: { id }, data }) : await getPrisma().category.create({ data });
    await logActivity({ userId: auth.user.id, action: id ? "category.update" : "category.create", entityType: "Category", entityId: cat.id, metadata: { name: cat.name } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, error: "That slug is already used.", fieldErrors: { slug: ["Already used"] } };
    throw e;
  }
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await authorizeAction(CATALOG_ROLES);
  if (!auth.ok) return auth;
  const count = await getPrisma().product.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: `Move or delete its ${count} product(s) first, or hide the category instead.` };
  await getPrisma().category.delete({ where: { id } });
  await logActivity({ userId: auth.user.id, action: "category.delete", entityType: "Category", entityId: id });
  refreshStorefront(CATALOG_TAG);
  return { ok: true };
}
