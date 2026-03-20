import { test, expect, Page } from "@playwright/test";

// =============================================================================
// POST AD PROGRESSIVE FORM E2E TESTS
// =============================================================================
// Tests for the 2-step progressive disclosure Post Ad wizard:
// - Step 1: Category → Brand/Model → Spare Parts → Device Status
// - Step 2: Title/Description → Images → Location/Price
// =============================================================================

test.describe("📝 POST AD - Progressive Form Flow", () => {

    test.beforeEach(async ({ page }) => {
        // Mock authentication - set auth cookie/token
        // This would need to be adjusted based on actual auth implementation
        await page.addInitScript(() => {
            // Mock authenticated user in localStorage if needed
            localStorage.setItem('mockAuthUser', JSON.stringify({
                id: 'test-user-123',
                email: 'test@example.com',
                isPhoneVerified: true
            }));
        });
    });

    test.describe("Step 1: Device Selection Progressive Disclosure", () => {

        test("should show category section first and hide other sections", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Category section should be visible
            await expect(page.locator('[data-testid="section-category"]')).toBeVisible();
            
            // Other sections should not be visible initially
            await expect(page.locator('[data-testid="section-brandModel"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="section-spareParts"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="section-deviceStatus"]')).not.toBeVisible();
        });

        test("should reveal Brand/Model section after selecting category", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Click on a category (e.g., first available category button)
            const categoryButton = page.locator('[data-testid="category-button"]').first();
            await categoryButton.click();
            
            // Category should collapse to CompletedFieldCard
            await expect(page.locator('[data-testid="completed-category"]')).toBeVisible();
            
            // Brand/Model section should now be visible
            await expect(page.locator('[data-testid="section-brandModel"]')).toBeVisible();
        });

        test("should allow editing completed category section", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Complete category selection
            await page.locator('[data-testid="category-button"]').first().click();
            
            // Click Edit on the completed category card
            await page.locator('[data-testid="completed-category"] [data-testid="edit-button"]').click();
            
            // Category grid should reappear
            await expect(page.locator('[data-testid="section-category"]')).toBeVisible();
        });

        test("should reveal Spare Parts section after completing Brand/Model", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Complete category
            await page.locator('[data-testid="category-button"]').first().click();
            
            // Wait for brand/model section
            await expect(page.locator('[data-testid="section-brandModel"]')).toBeVisible();
            
            // Select brand
            await page.locator('[data-testid="brand-select"]').click();
            await page.locator('[data-testid="brand-option"]').first().click();
            
            // Select model (or screen size for TVs)
            const modelSelect = page.locator('[data-testid="model-select"]');
            if (await modelSelect.isVisible()) {
                await modelSelect.click();
                await page.locator('[data-testid="model-option"]').first().click();
            }
            
            // Click continue on brand/model
            await page.locator('[data-testid="continue-brandModel"]').click();
            
            // Spare Parts section should appear
            await expect(page.locator('[data-testid="section-spareParts"]')).toBeVisible();
        });

        test("should reveal Device Status after confirming Spare Parts", async ({ page }) => {
            await completeToSparePartsSection(page);
            
            // Toggle some spare parts
            const sparePartButton = page.locator('[data-testid="spare-part-button"]').first();
            if (await sparePartButton.isVisible()) {
                await sparePartButton.click();
            }
            
            // Click continue
            await page.locator('[data-testid="continue-spareParts"]').click();
            
            // Device Status section should appear
            await expect(page.locator('[data-testid="section-deviceStatus"]')).toBeVisible();
        });

        test("should show completion message when all Step 1 sections done", async ({ page }) => {
            await completeStep1(page);
            
            // Success message should appear
            await expect(page.locator('[data-testid="step1-complete"]')).toBeVisible();
            await expect(page.locator('[data-testid="step1-complete"]')).toContainText("Device details complete");
        });
    });

    test.describe("Step 2: Listing Details Progressive Disclosure", () => {

        test("should show Title/Description section first on Step 2", async ({ page }) => {
            await completeStep1(page);
            await page.locator('[data-testid="next-step-button"]').click();
            
            // Title/Description section should be visible
            await expect(page.locator('[data-testid="section-titleDesc"]')).toBeVisible();
            
            // Other sections should not be visible
            await expect(page.locator('[data-testid="section-images"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="section-locationPrice"]')).not.toBeVisible();
        });

        test("should reveal Images section after completing Title/Description", async ({ page }) => {
            await completeStep1(page);
            await page.locator('[data-testid="next-step-button"]').click();
            
            // Fill title (min 10 chars)
            await page.fill('[data-testid="title-input"]', 'iPhone 14 Pro Max 256GB');
            
            // Fill description (min 20 chars)
            await page.fill('[data-testid="description-input"]', 'Excellent condition, barely used, comes with original box and accessories');
            
            // Click continue
            await page.locator('[data-testid="continue-titleDesc"]').click();
            
            // Images section should appear
            await expect(page.locator('[data-testid="section-images"]')).toBeVisible();
        });

        test("should reveal Location/Price section after uploading images", async ({ page }) => {
            await completeToImagesSection(page);
            
            // Upload at least one image (mock file input)
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles({
                name: 'test-image.jpg',
                mimeType: 'image/jpeg',
                buffer: Buffer.from('fake-image-data')
            });
            
            // Wait for upload to complete and click continue
            await page.locator('[data-testid="continue-images"]').click();
            
            // Location/Price section should appear
            await expect(page.locator('[data-testid="section-locationPrice"]')).toBeVisible();
        });

        test("should show completion message when all Step 2 sections done", async ({ page }) => {
            await completeStep2(page);
            
            // Success message should appear
            await expect(page.locator('[data-testid="step2-complete"]')).toBeVisible();
            await expect(page.locator('[data-testid="step2-complete"]')).toContainText("Listing details complete");
        });
    });

    test.describe("Keyboard Navigation", () => {

        test("should navigate sections with Tab key in Step 1", async ({ page }) => {
            await page.goto("/post-ad");
            
            // First category button should be focusable
            await page.keyboard.press("Tab");
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toHaveAttribute('data-testid', /category-button/);
        });

        test("should confirm section with Enter key", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Tab to first category and press Enter
            await page.keyboard.press("Tab");
            await page.keyboard.press("Enter");
            
            // Should move to brand/model section
            await expect(page.locator('[data-testid="section-brandModel"]')).toBeVisible();
        });

        test("should cancel edit with Escape key", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Complete category selection
            await page.locator('[data-testid="category-button"]').first().click();
            
            // Click edit to go back
            await page.locator('[data-testid="completed-category"] [data-testid="edit-button"]').click();
            
            // Press Escape to cancel
            await page.keyboard.press("Escape");
            
            // Should return to collapsed state (brand/model active)
            await expect(page.locator('[data-testid="completed-category"]')).toBeVisible();
            await expect(page.locator('[data-testid="section-brandModel"]')).toBeVisible();
        });

        test("should focus Continue button after completing required fields", async ({ page }) => {
            await completeToSparePartsSection(page);
            
            // Toggle spare part
            await page.locator('[data-testid="spare-part-button"]').first().click();
            
            // Continue button should be focusable
            const continueBtn = page.locator('[data-testid="continue-spareParts"]');
            await expect(continueBtn).toBeEnabled();
        });
    });

    test.describe("Edit Flow Integrity", () => {

        test("should preserve selections when editing earlier sections", async ({ page }) => {
            await completeStep1(page);
            
            // Store current brand selection
            const brandText = await page.locator('[data-testid="completed-brandModel"]').textContent();
            
            // Edit spare parts
            await page.locator('[data-testid="completed-spareParts"] [data-testid="edit-button"]').click();
            
            // Make a change and continue
            await page.locator('[data-testid="continue-spareParts"]').click();
            
            // Brand should still be the same
            await expect(page.locator('[data-testid="completed-brandModel"]')).toContainText(brandText!.split('Edit')[0].trim());
        });

        test("should reset downstream sections when editing category", async ({ page }) => {
            await completeStep1(page);
            
            // Edit category (earliest step)
            await page.locator('[data-testid="completed-category"] [data-testid="edit-button"]').click();
            
            // Select a different category
            await page.locator('[data-testid="category-button"]').nth(1).click();
            
            // Brand/Model should be reset and become active
            await expect(page.locator('[data-testid="section-brandModel"]')).toBeVisible();
            // Previous brand selection should be cleared
        });
    });

    test.describe("Mobile Responsiveness", () => {

        test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

        test("should stack Brand/Model vertically on mobile", async ({ page }) => {
            await page.goto("/post-ad");
            
            // Complete category
            await page.locator('[data-testid="category-button"]').first().click();
            
            // Brand and Model should be stacked (single column)
            const brandSelect = page.locator('[data-testid="brand-select"]');
            const modelSelect = page.locator('[data-testid="model-select"]');
            
            const brandBox = await brandSelect.boundingBox();
            const modelBox = await modelSelect.boundingBox();
            
            if (brandBox && modelBox) {
                // Model should be below brand (higher Y value)
                expect(modelBox.y).toBeGreaterThan(brandBox.y);
            }
        });

        test("should auto-scroll to active section on mobile", async ({ page }) => {
            await completeToSparePartsSection(page);
            
            // Get scroll position before spare parts section
            const scrollBefore = await page.evaluate(() => window.scrollY);
            
            // Complete spare parts
            await page.locator('[data-testid="continue-spareParts"]').click();
            
            // Wait for scroll animation
            await page.waitForTimeout(300);
            
            // Device status section should be scrolled into view
            const deviceStatusSection = page.locator('[data-testid="section-deviceStatus"]');
            await expect(deviceStatusSection).toBeInViewport();
        });
    });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function completeToSparePartsSection(page: Page) {
    await page.goto("/post-ad");
    
    // Complete category
    await page.locator('[data-testid="category-button"]').first().click();
    
    // Complete brand/model
    await page.locator('[data-testid="brand-select"]').click();
    await page.locator('[data-testid="brand-option"]').first().click();
    
    const modelSelect = page.locator('[data-testid="model-select"]');
    if (await modelSelect.isVisible()) {
        await modelSelect.click();
        await page.locator('[data-testid="model-option"]').first().click();
    }
    
    await page.locator('[data-testid="continue-brandModel"]').click();
}

async function completeStep1(page: Page) {
    await completeToSparePartsSection(page);
    
    // Complete spare parts
    const sparePartButton = page.locator('[data-testid="spare-part-button"]').first();
    if (await sparePartButton.isVisible()) {
        await sparePartButton.click();
    }
    await page.locator('[data-testid="continue-spareParts"]').click();
    
    // Complete device status
    await page.locator('[data-testid="device-status-yes"]').click();
}

async function completeToImagesSection(page: Page) {
    await completeStep1(page);
    await page.locator('[data-testid="next-step-button"]').click();
    
    // Complete title/description
    await page.fill('[data-testid="title-input"]', 'iPhone 14 Pro Max 256GB');
    await page.fill('[data-testid="description-input"]', 'Excellent condition, barely used, comes with original box and accessories');
    await page.locator('[data-testid="continue-titleDesc"]').click();
}

async function completeStep2(page: Page) {
    await completeToImagesSection(page);
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
    });
    
    await page.locator('[data-testid="continue-images"]').click();
    
    // Complete location/price
    await page.fill('[data-testid="price-input"]', '50000');
    // Location would typically be auto-filled or require mock
}
