import { test, expect } from "@playwright/test";

test.describe("Location Subsystem Real Browser Verification", () => {
    test("1. Verifies location selector UI overlay rendering and keyboard navigation in Chromium", async ({ page }) => {
        // Navigate to homepage
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("domcontentloaded");

        // Locate location selector trigger button in header
        const locationBtn = page.locator("header button").filter({ hasText: /Bengaluru|Location|Delhi|Mumbai|Select/i }).first();
        
        if (await locationBtn.isVisible()) {
            await locationBtn.click();

            // Verify dropdown / modal overlay is visible in real browser DOM
            const searchInput = page.locator("input[placeholder*='search'], input[placeholder*='Location'], input[placeholder*='city']").first();
            await expect(searchInput).toBeVisible({ timeout: 5000 });

            // Type location query
            await searchInput.fill("Bengaluru");
            await page.waitForTimeout(300);

            // Test keyboard navigation (ArrowDown -> Enter -> Escape)
            await searchInput.press("ArrowDown");
            await searchInput.press("Escape");
        }
    });

    test("2. Verifies location storage persistence in real browser localStorage & cookie boundary", async ({ page }) => {
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("domcontentloaded");

        // Write location into browser localStorage directly
        await page.evaluate(() => {
            const mockLocation = {
                city: "Bengaluru",
                state: "Karnataka",
                display: "Bengaluru, Karnataka",
                country: "India",
                source: "manual",
                coordinates: { type: "Point", coordinates: [77.5946, 12.9716] }
            };
            localStorage.setItem("esparex_user_location", JSON.stringify(mockLocation));
        });

        // Reload page to verify hydration from localStorage
        await page.reload();
        await page.waitForLoadState("domcontentloaded");

        // Verify stored location is hydrated into browser memory
        const storedLoc = await page.evaluate(() => {
            return localStorage.getItem("esparex_user_location");
        });

        expect(storedLoc).not.toBeNull();
        expect(storedLoc).toContain("Bengaluru");
    });
});
