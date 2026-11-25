import { expect, test } from "@playwright/test";

test("a customer can send a custom design request", async ({ page }) => {
  await page.goto("/customize?product=classic-oversized-tee");
  await expect(page.getByRole("heading", { level: 1, name: "Make it yours." })).toBeVisible();

  await page.getByRole("button", { name: /Back/ }).first().click();
  await page.getByLabel(/Describe your design/).fill("Team name across the back in white ink");
  await page.getByLabel(/Full name/).fill("E2E Customer");
  await page.getByLabel(/WhatsApp number/).fill("0712345678");
  await page.getByRole("button", { name: /Send request/ }).click();

  await expect(page.getByRole("heading", { name: "Request received." })).toBeVisible();
  await expect(page.getByText(/^CUS-\d{6}-[A-Z0-9]{5}$/)).toBeVisible();
  await expect(page.getByText(/This request is not an order/)).toBeVisible();
});

test("the custom request form validates required fields", async ({ page }) => {
  await page.goto("/customize");
  await page.getByRole("button", { name: /Send request/ }).click();
  await expect(page.getByText(/Tell us a bit more about your design/)).toBeVisible();
  await expect(page.getByText("Please enter your name")).toBeVisible();
});
