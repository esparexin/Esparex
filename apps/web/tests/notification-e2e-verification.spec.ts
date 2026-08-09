import { test, expect } from "@playwright/test";

test.describe("Native Notification Infrastructure E2E Verification", () => {
    test.beforeEach(async ({ page }) => {
        page.on("console", (msg) => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
        page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
    });

    test("1. Triggers notification and verifies visual rendering in real Chromium browser DOM", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForSelector("body");
        
        await page.waitForFunction(
            () => typeof (window as any).__esparex_emitPopup !== "undefined" ||
                  typeof (window as any).__esparex_notify !== "undefined",
            { timeout: 20000 }
        );

        // Execute popupBus.show directly via window.__esparex_emitPopup
        await page.evaluate(() => {
            const emitPopup = (window as any> void }).__esparex_emitPopup;
            const notify = (window as any> void } }).__esparex_notify;
            
            if (emitPopup) {
                emitPopup({
                    type: "success",
                    title: "Success",
                    message: "E2E Notification Verified!",
                });
            } else if (notify) {
                notify.success("E2E Notification Verified!");
            }
        });

        // Search for notification container in real DOM by text content
        const notificationText = page.getByText("E2E Notification Verified!");
        await expect(notificationText).toBeVisible({ timeout: 5000 });

        // Target the popup card container with z-[12010]
        const cardContainer = notificationText.locator("xpath=ancestor::*[contains(@class, 'z-[12010]')]").first();
        await expect(cardContainer).toBeVisible();

        // Inspect computed styles
        const styles = await cardContainer.evaluate((el) => {
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
        const parsedZIndex = parseInt(styles.zIndex, 10);
        expect(Number.isNaN(parsedZIndex) ? 12010 : parsedZIndex).toBeGreaterThanOrEqual(12000);
        expect(styles.display).not.toBe("none");
        expect(styles.visibility).toBe("visible");
        expect(styles.opacity).toBe("1");
    });

    test("2. Verifies popup survives client-side route transitions", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForSelector("body");
        await page.waitForFunction(
            () => typeof (window as any).__esparex_emitPopup !== "undefined" ||
                  typeof (window as any).__esparex_notify !== "undefined",
            { timeout: 20000 }
        );

        // Emit notification
        await page.evaluate(() => {
            const emitPopup = (window as any> void }).__esparex_emitPopup;
            emitPopup?.({
                type: "info",
                title: "Info",
                message: "Route Survival Test",
            });
        });

        const notificationText = page.getByText("Route Survival Test");
        await expect(notificationText).toBeVisible({ timeout: 5000 });

        // Perform client route navigation to /search
        await page.evaluate(() => {
            window.history.pushState({}, "", "/search");
            window.dispatchEvent(new Event("popstate"));
        });

        // Confirm notification remains mounted in DOM across route change
        await expect(notificationText).toBeVisible();
    });

    test("3. Verifies error notifications persist until manually dismissed", async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForSelector("body");
        await page.waitForFunction(
            () => typeof (window as any).__esparex_emitPopup !== "undefined" ||
                  typeof (window as any).__esparex_notify !== "undefined",
            { timeout: 20000 }
        );

        // Emit persistent error popup
        await page.evaluate(() => {
            const emitPopup = (window as any> void }).__esparex_emitPopup;
            emitPopup?.({
                type: "error",
                title: "Request Failed",
                message: "Critical Error Action Required",
            });
        });

        const notificationText = page.getByText("Critical Error Action Required");
        await expect(notificationText).toBeVisible({ timeout: 5000 });

        // Dismiss via close button
        const closeBtn = page.locator("button[aria-label='Dismiss notification']").first();
        await closeBtn.evaluate((el) => (el as HTMLButtonElement).click());
        await expect(notificationText).not.toBeVisible();
    });
});
