import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("admin", () => {
  test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders/);
  });

  test("a wrong password shows a generic error", async ({ page }) => {
    await signIn(page, "admin@e2e.test", "not-the-password");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("an admin can confirm an order and record payment", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
    await page.getByRole("link", { name: /^ORK-/ }).first().click();
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();

    await page.getByLabel("New status").selectOption("CONFIRMED");
    await page.getByLabel("Note (optional)").first().fill("Confirmed on WhatsApp (e2e)");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByText("Status updated.")).toBeVisible();
    await expect(page.getByText("Confirmed on WhatsApp (e2e)")).toBeVisible();

    await page.getByLabel("Payment status").selectOption("PAID");
    await page.getByRole("button", { name: "Update payment" }).click();
    await expect(page.getByText("Payment updated.")).toBeVisible();
  });

  test("an admin can quote a custom request and convert it to an order", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/customizations");
    await page.getByRole("link", { name: /^CUS-/ }).first().click();

    await page.getByLabel("Unit price (LKR)").fill("3000");
    await page.getByLabel("Setup / print fee").fill("1500");
    await page.getByRole("button", { name: "Save draft quotation" }).click();
    await expect(page.getByText("Version 1")).toBeVisible();

    await page.getByRole("button", { name: "Mark as sent" }).click();
    await page.getByRole("button", { name: "Customer accepted" }).click();
    await page.getByLabel("Delivery address").fill("45 Kandy Road, Kadawatha");
    await page.getByRole("button", { name: "Create order" }).click();

    await expect(page).toHaveURL(/\/admin\/orders\//);
    await expect(page.getByText(/Created from custom request CUS-/)).toBeVisible();
    await expect(page.getByText("Setup / print fee")).toBeVisible();
  });

  test("admins can edit stock and the store reflects product changes", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/products?q=minimal");
    await page.getByRole("link", { name: /Minimal Hoodie/ }).click();
    await page.getByLabel("Name").fill("Minimal Hoodie Edited");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    await page.goto("/products/minimal-hoodie");
    await expect(page.getByRole("heading", { level: 1, name: "Minimal Hoodie Edited" })).toBeVisible();
  });

  test("a product created after deploy gets a working page", async ({ page }) => {
    // Its page isn't prebuilt, so it renders on demand (this caught a header crash).
    await signIn(page);
    await page.goto("/admin/products/new");
    await page.getByLabel("Name").fill("E2E Night Tee");
    await page.getByLabel("Description").fill("Created by the end-to-end tests.");
    await page.getByLabel("Base price (LKR)").fill("3100");
    await page.getByLabel("Status").selectOption("ACTIVE");
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page.getByText(/Product created/)).toBeVisible();
    await page.getByRole("button", { name: "Add variant" }).click();
    await page.getByRole("button", { name: "Save variant" }).click();
    await expect(page.getByRole("cell", { name: "ORK-E2ENIG-BLA-M" })).toBeVisible();

    const res = await page.goto("/products/e2e-night-tee");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Night Tee" })).toBeVisible();
  });

  test("signing out ends the session", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
