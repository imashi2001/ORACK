import { expect, type Page } from "@playwright/test";

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@e2e.test",
  password: process.env.E2E_ADMIN_PASSWORD ?? "e2e-password-123",
};

export async function signIn(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the session cookie: a successful sign-in redirects away from the login page.
  if (password === ADMIN.password) await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"));
}

/** Adds one in-stock size of the seeded Classic Oversized Tee (Black) to the bag from its product page. */
export async function addTeeToBag(page: Page) {
  await page.goto("/products/classic-oversized-tee");
  await expect(page.getByRole("heading", { level: 1, name: "Classic Oversized Tee" })).toBeVisible();
  const sizes = page.getByRole("group", { name: "Size" }).getByRole("button");
  const count = await sizes.count();
  for (let i = 0; i < count; i++) {
    if (await sizes.nth(i).isEnabled()) {
      await sizes.nth(i).click();
      break;
    }
  }
  await page.getByRole("button", { name: /Add to bag/ }).first().click();
}
