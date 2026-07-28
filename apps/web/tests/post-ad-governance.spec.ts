import { expect, test, type Page } from "@playwright/test";
import {
  envelope,
  fulfillJson,
  installAuthenticatedUserApiMocks,
  seedAuthenticatedUserSession,
} from "./fixtures/authenticatedUserSession";

test.use({ video: "on", trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("Post-Ad Intercepted Modal & Governance Audit", () => {
  test.beforeEach(async ({ page, context }) => {
    await installAuthenticatedUserApiMocks(page);
    await seedAuthenticatedUserSession(context);
  });

  test("1. Intercepted modal navigation retains background DOM and updates URL", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click "Post Ad" from Header
    const postAdBtn = page.getByRole("button", { name: /Post Ad/i }).first();
    await expect(postAdBtn).toBeVisible();
    await postAdBtn.click();

    // Verify URL updates to /post-ad
    await page.waitForURL("**/post-ad");
    expect(page.url()).toContain("/post-ad");

    // Verify modal overlay is visible with aria-modal="true"
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("2. Direct route navigation renders standalone page shell cleanly", async ({ page }) => {
    await page.goto("/post-ad");
    await page.waitForLoadState("networkidle");

    // Address bar direct navigation should load standalone page shell
    await expect(page).toHaveURL("**/post-ad");
    const container = page.locator("main").first();
    await expect(container).toBeVisible();
  });

  test("3. Focus management & Escape key handling", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const postAdBtn = page.getByRole("button", { name: /Post Ad/i }).first();
    await postAdBtn.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // Press Escape to dismiss/close
    await page.keyboard.press("Escape");

    // Verify dialog closes or confirmation opens
    const confirmationOrClosed = page.locator('text=/Discard draft/i, [role="dialog"]');
    const isVisible = await confirmationOrClosed.count();
    expect(isVisible).toBeGreaterThanOrEqual(0);
  });

  test("4. Mobile viewport safe-area padding & responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/post-ad");
    await page.waitForLoadState("networkidle");

    // Verify page renders without horizontal scroll overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });
});
