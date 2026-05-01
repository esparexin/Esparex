import { test, expect } from "@playwright/test";

test.describe("UI Duplication Guard — Home Page", () => {
    test("Header must render only once", async ({ page }) => {
        await page.goto("/");

        // We target the 'header' tag specifically as per the prompt rules
        const headers = await page.locator("header");
        await expect(headers).toHaveCount(1);
    });

    test("Navigation bar must render only once", async ({ page }) => {
        await page.goto("/");

        const navs = await page.locator("nav");
        // Some layouts might not have a <nav> but if it exists, it should be unique
        const navCount = await navs.count();
        if (navCount > 0) {
            await expect(navs).toHaveCount(1);
        }
    });

    test("Search input must render only once", async ({ page }) => {
        await page.goto("/");

        // The home page has a Hero search and a StickyHeader search.
        // However, StickyHeader search is HIDDEN on the home page usually if we follow the "no overlap" rule.
        // Or if they both exist, they must be unique in their role.
        // The prompt says "Search input must render only once".

        const searchInputs = await page.locator(
            'input[type="search"], input[placeholder*="Search"]'
        );

        // If we have HeroSearch and StickyHeader, we might have 2. 
        // We need to verify if one is hidden or if they are intended to be separate.
        // But the rule says "only once".
        await expect(searchInputs).toHaveCount(1);
    });

    test("No hidden duplicate headers (mobile check)", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
        await page.goto("/");

        const headers = await page.locator("header");
        await expect(headers).toHaveCount(1);
    });
});
