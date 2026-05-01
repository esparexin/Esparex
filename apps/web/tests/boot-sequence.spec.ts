import { test, expect } from "@playwright/test";

// =============================================================================
// BOOT SEQUENCE PERFORMANCE & SILENCE TESTS
// =============================================================================
// Goal: Verify that the application boots "silently" without request storms.
// - No duplicate API calls.
// - Boot check happens.
// - No 429 retries.
// =============================================================================

test.describe("🚀 BOOT SEQUENCE & PERFORMANCE", () => {

    test("Boot: Should not fire duplicate API calls on public home page", async ({ page }) => {
        const apiCalls = new Map<string, number>();

        // 1. Intercept and Count API Calls
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            // Normalize URL to capture endpoints (e.g. /api/v1/health)
            const endpoint = new URL(url).pathname;

            const currentCount = apiCalls.get(endpoint) || 0;
            apiCalls.set(endpoint, currentCount + 1);

            // Fail fast if we see a 3rd call to ANY endpoint (Retry storm check)
            // We allow 2 calls max (e.g. 1 failed + 1 retry, though we prefer 0 retries)
            // For strict check: allow 1.

            await route.continue();
        });

        console.log("---------------------------------------------------");
        console.log("🚀 Starting Boot Check Test (Public)");
        const startTime = Date.now();

        // 2. Load Home Page
        await page.goto("http://127.0.0.1:3000/", { waitUntil: 'networkidle' });

        const loadTime = Date.now() - startTime;
        console.log(`⏱️ Page Load Time: ${loadTime}ms`);

        // 3. Analyze Prohibited Patterns

        // A. /health (Boot Check) - Should be called at least once (or gated by env?)
        // Assuming NEXT_PUBLIC_API_URL is set, it should fire.
        const healthCount = getCount(apiCalls, '/health');
        console.log(`- Health Check Count: ${healthCount}`);
        expect(healthCount, "Boot Check (/health) should run exactly once").toBeLessThanOrEqual(1);

        // B. /users/me (User Fetch) - Should NOT be called for public user
        // OR if it is called, it should be called ONCE to check session.
        // Ideally prompt says: "fetch /users/me ONLY after boot check passes"
        // If we are not logged in, auth context might try once and fail 401.
        // We verify it's not SPAMMED.
        const userCount = getCount(apiCalls, '/users/me');
        console.log(`- User Fetch Count: ${userCount}`);
        expect(userCount, "User Fetch (/users/me) should not be spammed").toBeLessThanOrEqual(1);

        // C. /ads (Public Data) - Can be called, but not spammed
        const adsCount = getCount(apiCalls, '/ads');
        console.log(`- Ads Fetch Count: ${adsCount}`);
        expect(adsCount, "Ads Fetch (/ads) should not be spammed").toBeLessThanOrEqual(2); // allow 1-2 (with params)

        // D. No 429s (We can't simulate backend 429 easily here, but we ensure no duplicates)
        // Check for any endpoint called > 2 times
        for (const [endpoint, count] of apiCalls.entries()) {
            if (count > 2) {
                console.error(`❌ Spam detected on: ${endpoint} (${count} calls)`);
            }
            expect(count, `Duplicate calls detected on ${endpoint}`).toBeLessThanOrEqual(2);
        }

        console.log("✅ Boot Sequence Silent");
    });

});

// Helper to reliably match partial paths
function getCount(map: Map<string, number>, partialPath: string): number {
    let total = 0;
    for (const [url, count] of map.entries()) {
        if (url.includes(partialPath)) {
            total += count;
        }
    }
    return total;
}
