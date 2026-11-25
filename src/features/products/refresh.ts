import "server-only";
import { revalidatePath, updateTag } from "next/cache";

/**
 * Call from admin Server Actions after catalogue or settings changes.
 * `updateTag` refreshes the cached data immediately; `revalidatePath` also discards
 * the prerendered storefront pages, so the next visitor gets the new version instead
 * of one stale view (Next serves prerendered pages stale-while-revalidate otherwise).
 */
export function refreshStorefront(tag: string) {
  updateTag(tag);
  revalidatePath("/", "layout");
}
