import { test, expect } from "@playwright.test";

test.describe("Native Notification Infrastructure E2E Verification", () => {
    test("1. Triggers notification and verifies visual rendering in real Chromium browser DOM", async ({ page }) => {
        // Navigate to homepage
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("domcontentloaded");

        // Execute notify.success directly in browser runtime context
        await page.evaluate(() => {
            // Import feedback module and emit success notification
            import("/src/lib/feedback.ts").then((m) => {
                m.notify.success("E2E Notification Verified!");
            });
        });

        // Verify Dialog Element appears in real DOM
        const popupContent = page.locator("[role='dialog']").first();
        await expect(popupContent).toBeVisible({ timeout: 5000 });

        // Verify text content
        await expect(popupContent).toContainText("E2E Notification Verified!");

        // Inspect computed styles in real browser rendering engine
        const styles = await popupContent.evaluate((el) => {
            const cs = window.getComputedStyle(el);
            return {
                position: cs.position,
                zIndex: cs.zIndex,
                display: cs.display,
                visibility: cs.visibility,
                opacity: cs.opacity,
                pointerEvents: cs.pointerEvents,
            };
        });

        expect(styles.position).toBe("fixed");
        expect(Number(styles.zIndex)).toBeGreaterThanOrEqual(12000);
        expect(styles.display).not.toBe("none");
        expect(styles.visibility).toBe("visible");
        expect(styles.opacity).toBe("1");
    });

    test("2. Verifies popup survives client-side route transitions", async ({ page }) => {
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("domcontentloaded");

        // Emit notification
        await page.evaluate(() => {
            import("/src/lib/feedback.ts").then((m) => {
                m.notify.info("Route Survival Test");
            });
        });

        const popupContent = page.locator("[role='dialog']").first();
        await expect(popupContent).toBeVisible({ timeout: 5000 });

        // Perform client route navigation to /search
        await page.evaluate(() => {
            window.history.pushState({}, "", "/search");
            window.dispatchEvent(new Event("popstate"));
        });

        // Confirm notification remains mounted in DOM across route change
        await expect(popupContent).toBeVisible();
        await expect(popupContent).toContainText("Route Survival Test");
    });
});
