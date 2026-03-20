import { test, expect } from "@playwright/test";

// =============================================================================
// CONFIGURATION: Critical Routes to Protect
// =============================================================================

const publicPages = [
    { name: "Home", path: "/" },
    { name: "Search", path: "/search" },
];

// =============================================================================
// GLOBAL UI RULES
// =============================================================================

test.describe("🛡️ UI GOVERNANCE GUARDS", () => {

    // -------------------------------------------------------------------------
    // 1. PUBLIC PAGES (No Auth Required)
    // -------------------------------------------------------------------------

    for (const { name, path } of publicPages) {
        test(`[Public] ${name} (${path}) must follow strict UI rules`, async ({ page }) => {
            console.log(`Testing ${name} at ${path}`);
            await page.goto(path);

            // ✅ Rule 1: One Primary Section
            // Ensures content doesn't double-render
            const primarySections = page.locator("section[data-primary]");
            await expect(primarySections, `[${name}] Must have exactly 1 primary section`).toHaveCount(1);

            // ✅ Rule 2: Header Appears Once
            const headers = page.locator("header");
            await expect(headers, `[${name}] Must have exactly 1 header`).toHaveCount(1);

            // ✅ Rule 3: Empty State vs Content (Heuristic)
            // If explicit empty state exists, heavy content grids should NOT exist
            const emptyState = page.locator('[data-testid="empty-state"]');
            const dataGrid = page.locator('[data-testid="data-grid"]');

            if (await emptyState.isVisible()) {
                await expect(dataGrid, `[${name}] Empty state is visible, so data grid must be hidden`).not.toBeVisible();
            }

            // ✅ Rule 4: Mobile Layout Guard
            // Switch to Mobile
            await page.setViewportSize({ width: 375, height: 812 });

            // Re-verify: Mobile should NOT duplicate DOM
            await expect(primarySections, `[${name}] Mobile: Must still have 1 primary section`).toHaveCount(1);
            await expect(headers, `[${name}] Mobile: Must still have 1 header`).toHaveCount(1);
        });
    }

});
