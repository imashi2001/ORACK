import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("security", () => {
  test("pages send security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("Server Actions reject cross-site requests", async ({ request }) => {
    const res = await request.post("/", {
      headers: { "Next-Action": "0000000000000000000000000000000000000000", Origin: "https://evil.example", "Content-Type": "text/plain;charset=UTF-8" },
      data: "[]",
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("the admin area isn't indexable", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("accessibility (axe, WCAG 2.1 A/AA)", () => {
  for (const path of ["/", "/products", "/products/classic-oversized-tee", "/customize", "/admin/login"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
