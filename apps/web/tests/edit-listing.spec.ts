import { test, expect, Page } from "@playwright/test";

// ─── HTTP Method Constants ────────────────────────────────────────────────────
// Centralised so that a future API contract change requires a single edit here.
const HTTP = {
    GET:    "GET",
    POST:   "POST",
    PATCH:  "PATCH", // Edit listing uses PATCH — see listingMutationAPI.ts
    DELETE: "DELETE",
} as const;

// =============================================================================
// LISTING EDIT E2E REGRESSION SUITE
// =============================================================================

// Wraps a data payload in the standard API envelope used by unwrapApiPayload / toApiResult.
const envelope = <T>(data: T) => ({ success: true, data });

test.describe("📝 EDIT AD - End-to-End Regression Suite", () => {

    const mockListingId  = "60b9b0b9b0b9b0b9b0b9b0b9";
    const mockUserId     = "aabbccddee1122334455aabb";
    const mockCategoryId = "category-123";
    const mockBrandId    = "brand-123";
    const mockModelId    = "model-123";

    // -------------------------------------------------------------------------
    // Mock Data — all required Ad schema fields are populated
    // -------------------------------------------------------------------------
    const mockListing = {
        _id:          mockListingId,
        id:           mockListingId,
        sellerId:     mockUserId,
        categoryId:   mockCategoryId,
        categoryName: "Smartphones",
        brandName:    "Apple",
        brandId:      mockBrandId,
        modelName:    "iPhone 14",
        modelId:      mockModelId,
        title:        "Pristine iPhone 14",
        description:  "Barely used iPhone 14, 128GB.",
        price:        70000,
        status:       "live",
        createdAt:    "2024-01-01T00:00:00.000Z",
        updatedAt:    "2024-01-01T00:00:00.000Z",
        location: {
            city:    "Bangalore",
            state:   "Karnataka",
            display: "Bangalore, Karnataka",
        },
        images: [
            "https://esparex.s3.amazonaws.com/test-image-1.jpg",
            "https://esparex.s3.amazonaws.com/test-image-2.jpg",
        ],
        attributes: {
            ram:     "8GB",
            storage: "128GB",
        },
        deviceCondition: "power_on",
        views: 0,
    };

    const mockUser = {
        id:              mockUserId,
        mobile:          "9030787819",
        role:            "user",
        name:            "Test User",
        isPhoneVerified: true,
    };

    const mockCatalogData = {
        categories: [{ id: mockCategoryId, name: "Smartphones" }],
        brands:     [{ id: mockBrandId,    name: "Apple" }],
        models:     [{ id: mockModelId,    name: "iPhone 14" }],
        categorySchema: {
            categoryId:   mockCategoryId,
            categoryName: "Smartphones",
            filters: [
                { id: "ram",     name: "RAM",     type: "text", isRequired: false },
                { id: "storage", name: "Storage", type: "text", isRequired: false },
            ],
        },
    };

    // -------------------------------------------------------------------------
    // Setup — runs before every test
    // -------------------------------------------------------------------------
    test.beforeEach(async ({ page }) => {
        // Inject auth cookie so the Next.js private layout reads initialHasAuthCookie: true
        await page.context().addCookies([
            { name: "esparex_auth", value: "fake-token-for-test", url: "http://localhost:3000" },
            { name: "esparex_auth", value: "fake-token-for-test", url: "http://127.0.0.1:3000" },
        ]);

        // Signal to AuthContext that a valid session exists
        await page.addInitScript(() => {
            localStorage.setItem("esparex_user_session", "1");
        });

        // ── API mocks ──────────────────────────────────────────────────────────
        // Health gate — must succeed so apiClient.checkHealth() unblocks the AuthContext
        await page.route(/\/api\/v1\/health/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, status: "ok", mode: "live" }),
            })
        );

        // CSRF token (required for state-changing PUT/POST requests)
        await page.route(/\/api\/v1\/csrf-token/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ csrfToken: "mock-csrf-token-for-test" }),
            })
        );
        await page.route(/\/api\/v1\/auth\/csrf/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ csrfToken: "mock-csrf-token-for-test" }),
            })
        );

        // Current user
        await page.route(/\/api\/v1\/users\/me/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope(mockUser)),
            })
        );

        // Saved ads (background fetch — must not 404)
        await page.route(/\/api\/v1\/users\/saved-ads/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope([])),
            })
        );

        // Listing detail (GET only; PATCH is handled by the edit endpoint below)
        await page.route(new RegExp(`/api/v1/listings/${mockListingId}$`), (route) => {
            if (route.request().method() === HTTP.GET) {
                route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(envelope(mockListing)),
                });
            } else {
                route.fallback();
            }
        });

        // ── Catalog endpoints ──────────────────────────────────────────────────
        await page.route(/\/api\/v1\/catalog\/categories(\?.*)?$/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope(mockCatalogData.categories)),
            })
        );

        await page.route(/\/api\/v1\/catalog\/brands(\?.*)?$/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope(mockCatalogData.brands)),
            })
        );

        await page.route(/\/api\/v1\/catalog\/models(\?.*)?$/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope(mockCatalogData.models)),
            })
        );

        await page.route(new RegExp(`/api/v1/catalog/categories/${mockCategoryId}/schema`), (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope(mockCatalogData.categorySchema)),
            })
        );

        await page.route(/\/api\/v1\/catalog\/spare-parts(\?.*)?$/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(envelope([])),
            })
        );

        // ── Default edit endpoint (individual tests may override) ──────────────
        // Returns "pending" for sensitive changes, "live" for non-sensitive ones.
        await page.route(new RegExp(`/api/v1/listings/${mockListingId}/edit`), async (route) => {
            if (route.request().method() === HTTP.PATCH) {
                const payload = JSON.parse(route.request().postData() ?? "{}");
                const isSensitive =
                    payload.title       !== mockListing.title ||
                    payload.description !== mockListing.description ||
                    payload.price       !== mockListing.price ||
                    JSON.stringify(payload.images) !== JSON.stringify(mockListing.images);

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        success: true,
                        listing: { ...mockListing, ...payload, status: isSensitive ? "pending" : "live" },
                    }),
                });
            } else {
                route.fallback();
            }
        });

        // Image upload (flat response — not wrapped in the standard envelope)
        await page.route(/\/api\/upload\/ad-image/, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    url: "https://esparex.s3.amazonaws.com/mock-uploaded-image.jpg",
                }),
            })
        );
    });

    // -------------------------------------------------------------------------
    // Helper: navigate to the edit page and wait for full hydration
    // -------------------------------------------------------------------------
    async function gotoEditPage(page: Page) {
        await page.goto(`/edit-ad/${mockListingId}`);
        await page.waitForLoadState("load", { timeout: 10_000 });

        // Wait for the EditAdWrapper to render (or an error boundary to show)
        await expect(
            page.locator(".edit-ad-wrapper")
                .or(page.locator("text=Error Loading Listing"))
                .or(page.locator("text=Listing not found"))
                .first()
        ).toBeVisible({ timeout: 25_000 });

        // Fail fast with a clear message if listing fetch returned null
        if (await page.locator("text=Error Loading Listing").isVisible()) {
            throw new Error("EditAdWrapper is in error state — listing fetch likely returned null");
        }
    }

    // =========================================================================
    // TEST 1 & 2: Load Existing Listing + Locked Identity Fields
    // =========================================================================
    test("1. Load Existing Listing & 2. Locked Identity Fields", async ({ page }) => {
        await gotoEditPage(page);

        // Editing banner from EditAdWrapper
        await expect(page.locator("text=Editing Listing:")).toBeVisible();

        // Verify pre-populated form fields (Step 2 is active in edit mode)
        const titleInput = page.locator('input[name="title"]');
        const descInput  = page.locator('textarea[name="description"]');
        const priceInput = page.locator('input[name="price"]');

        await expect(titleInput).toHaveValue(mockListing.title, { timeout: 10_000 });
        await expect(descInput).toHaveValue(mockListing.description);
        await expect(priceInput).toHaveValue(mockListing.price.toString());

        // Navigate back to Step 1 and confirm identity fields are locked
        const backBtn = page.locator("text=← Back to Step 1");
        if (await backBtn.count() > 0) {
            await backBtn.first().click();
            await page.waitForTimeout(1000);

            const categoryBtn = page.locator("button", { hasText: "Smartphones" }).first();
            if (await categoryBtn.count() > 0) {
                const cls = await categoryBtn.getAttribute("class") ?? "";
                expect(cls.toLowerCase()).toMatch(/cursor-not-allowed|disabled|opacity-50/);
            }
        }
    });

    // =========================================================================
    // TEST 3: Non-Sensitive Edit
    // =========================================================================
    test("3. Non-Sensitive Edit", async ({ page }) => {
        let capturedPayload: Record<string, unknown> | null = null;

        await page.route(`**/api/v1/listings/${mockListingId}/edit`, async (route) => {
            if (route.request().method() === HTTP.PATCH) {
                capturedPayload = JSON.parse(route.request().postData() ?? "{}");
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, listing: { ...mockListing, status: "live" } }),
                });
            } else {
                route.fallback();
            }
        });

        await gotoEditPage(page);

        const saveBtn = page.locator('button:has-text("Save Changes")');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        await page.waitForTimeout(2_000);
        expect(capturedPayload).not.toBeNull();
    });

    // =========================================================================
    // TEST 4: Sensitive Edit — triggers re-review
    // =========================================================================
    test("4. Sensitive Edit (Triggers Re-review)", async ({ page }) => {
        let capturedPayload: Record<string, unknown> | null = null;

        await page.route(`**/api/v1/listings/${mockListingId}/edit`, async (route) => {
            if (route.request().method() === HTTP.PATCH) {
                capturedPayload = JSON.parse(route.request().postData() ?? "{}");
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, listing: { ...mockListing, status: "pending" } }),
                });
            } else {
                route.fallback();
            }
        });

        await gotoEditPage(page);

        const titleInput = page.locator('input[name="title"]');
        await expect(titleInput).toHaveValue(mockListing.title);
        await titleInput.fill("Modified iPhone 14");
        await titleInput.blur();

        const saveBtn = page.locator('button:has-text("Save Changes")');
        await saveBtn.click();

        await page.waitForTimeout(2_000);

        if (!capturedPayload) throw new Error("PATCH payload was not captured");
        expect(capturedPayload.title).toBe("Modified iPhone 14");
    });

    // =========================================================================
    // TEST 5 & 6: Remove Existing Image + Add New Image
    // =========================================================================
    test("5. Remove Existing Image & 6. Add New Image", async ({ page }) => {
        let capturedPayload: Record<string, unknown> | null = null;

        await page.route(`**/api/v1/listings/${mockListingId}/edit`, async (route) => {
            if (route.request().method() === HTTP.PATCH) {
                capturedPayload = JSON.parse(route.request().postData() ?? "{}");
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, listing: { ...mockListing, status: "pending" } }),
                });
            } else {
                route.fallback();
            }
        });

        await gotoEditPage(page);

        // Remove the first existing image
        const removeButton = page.locator('button[aria-label="Remove image"]').first();
        await expect(removeButton).toBeVisible();
        await removeButton.click();

        // Upload a replacement image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name:     "new-image.jpg",
            mimeType: "image/jpeg",
            buffer:   Buffer.from("fake-image-data"),
        });

        // Wait for the blob preview to confirm async compression/processing is done
        await expect(page.locator('img[src^="blob:"]').first()).toBeVisible({ timeout: 10_000 });

        const saveBtn = page.locator('button:has-text("Save Changes")');
        await saveBtn.click();

        await page.waitForTimeout(2_000);

        if (!capturedPayload) throw new Error("PUT payload was not captured");
        expect(capturedPayload.images).toBeDefined();
    });

    // =========================================================================
    // TEST 9: Validation Errors
    // =========================================================================
    test("9. Validation Errors", async ({ page }) => {
        await gotoEditPage(page);

        const titleInput = page.locator('input[name="title"]');
        await expect(titleInput).toBeVisible();
        await titleInput.fill("");
        await titleInput.blur();

        await page.locator('button:has-text("Save Changes")').click();

        await expect(
            page.locator("text=Title must be at least").or(page.locator('[role="alert"]')).first()
        ).toBeVisible({ timeout: 5_000 });
    });

    // =========================================================================
    // TEST 10: Network Failure Recovery
    // =========================================================================
    test("10. Network Failure Recovery", async ({ page }) => {
        await page.route(`**/api/v1/listings/${mockListingId}/edit`, async (route) => {
            if (route.request().method() === HTTP.PATCH) {
                await route.abort("failed");
            } else {
                route.fallback();
            }
        });

        await gotoEditPage(page);

        await page.locator('button:has-text("Save Changes")').click();

        await expect(
            page.locator("text=failed")
                .or(page.locator('[role="alert"]'))
                .or(page.locator("text=Error"))
                .or(page.locator("text=error"))
                .first()
        ).toBeVisible({ timeout: 10_000 });
    });

    // =========================================================================
    // TEST 11: Navigation Guard Regression Test
    // =========================================================================
    test("11. Navigation Guard Regression Test", async ({ page }) => {
        await gotoEditPage(page);

        const saveBtn = page.locator('button:has-text("Save Changes")');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        await expect(
            page.locator("text=Ad Updated").or(page.locator("text=Ad Submitted"))
        ).toBeVisible({ timeout: 10_000 });

        const doneBtn = page.locator('button:has-text("Done")');
        await expect(doneBtn).toBeVisible();
        await doneBtn.click();

        await expect(page.locator("text=Unsaved Changes")).not.toBeVisible();
    });
});
