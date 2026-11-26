import { expect, test } from "@playwright/test";
import { addTeeToBag } from "./helpers";

test.describe("storefront", () => {
  test("home page shows the hero, collection and categories", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Live bold/i);
    await expect(page.getByRole("heading", { name: "Featured collection" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Classic Oversized Tee" }).first()).toBeVisible();
    expect(errors, `console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("listing filters by category, searches and sorts", async ({ page }) => {
    await page.goto("/products?category=hoodies");
    await expect(page.getByRole("heading", { level: 1, name: "Hoodies" })).toBeVisible();
    await expect(page.getByText("Essential Hoodie")).toBeVisible();
    await expect(page.getByText("Classic Oversized Tee")).toHaveCount(0);

    await page.goto("/products?q=globe");
    await expect(page.getByText("1 product", { exact: true })).toBeVisible();

    await page.goto("/products");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("sold-out sizes can't be selected", async ({ page }) => {
    await page.goto("/products/signature-logo-tee");
    const soldOut = page.getByRole("group", { name: "Size" }).getByRole("button", { name: /out of stock/ });
    await expect(soldOut.first()).toBeDisabled();
  });

  test("checkout validates details", async ({ page }) => {
    await addTeeToBag(page);
    const bag = page.getByRole("dialog");
    await bag.getByRole("button", { name: /Checkout/ }).click();
    await bag.getByLabel("Full name").fill("E2E Tester");
    await bag.getByLabel("WhatsApp number").fill("12345");
    await bag.getByLabel("Delivery address").fill("12 Galle Road, Colombo 03");
    await bag.getByRole("button", { name: "Place order" }).click();
    await expect(bag.getByText(/valid Sri Lankan mobile number/)).toBeVisible();
  });

  test("a customer can place an order and hand it off to WhatsApp", async ({ page }) => {
    await addTeeToBag(page);
    const bag = page.getByRole("dialog");
    await expect(bag.getByText("Classic Oversized Tee")).toBeVisible();
    await bag.getByRole("button", { name: /Checkout/ }).click();
    await bag.getByLabel("Full name").fill("E2E Tester");
    await bag.getByLabel("WhatsApp number").fill("077 123 4567");
    await bag.getByLabel("Delivery address").fill("12 Galle Road, Colombo 03");
    await bag.getByRole("button", { name: "Place order" }).click();

    await expect(bag.getByRole("heading", { name: "Order received." })).toBeVisible();
    const reference = (await bag.getByText(/^ORK-\d{6}-[A-Z0-9]{5}$/).textContent())!;
    const wa = bag.getByRole("link", { name: /Send on WhatsApp/ });
    await expect(wa).toHaveAttribute("href", new RegExp(`^https://wa\\.me/.*${encodeURIComponent(reference)}`));

    // The bag is emptied after a successful order.
    await bag.getByRole("button", { name: "Continue shopping" }).click();
    await expect(page.getByRole("button", { name: "Open bag, 0 items" })).toBeVisible();
  });
});
