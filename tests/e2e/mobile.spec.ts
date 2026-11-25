import { expect, test } from "@playwright/test";
import { addTeeToBag } from "./helpers";

test.describe("mobile", () => {
  test("menu opens and navigates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Mobile" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Customize" }).click();
    await expect(page).toHaveURL(/\/customize/);
  });

  test("pages don't scroll sideways", async ({ page }) => {
    for (const path of ["/", "/products", "/products/classic-oversized-tee", "/customize"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test("the bag opens full width", async ({ page }) => {
    await addTeeToBag(page);
    const bag = page.getByRole("dialog");
    await expect(bag).toBeVisible();
    const box = await bag.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  });
});
