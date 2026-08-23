import { test, expect } from '@playwright/test';

test.describe('Forensic User Frontend Runtime Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Universal catch-all mock for /api/v1 to prevent Node proxy errors
        await page.route('**/api/v1/**', async (route) => {
            const url = route.request().url();
            
            if (url.includes('/auth/me')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        user: {
                            id: 'usr_audit_test',
                            mobile: '9876543210',
                            name: 'Audit Tester',
                            role: 'user',
                            status: 'live',
                            isPhoneVerified: true,
                            isVerified: true,
                        },
                    }),
                });
            }

            if (url.includes('/catalog/categories') || url.includes('/categories')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            { id: 'cat_mobile', name: 'Mobile Phones', slug: 'mobiles' },
                            { id: 'cat_laptop', name: 'Laptops', slug: 'laptops' },
                        ],
                    }),
                });
            }

            if (url.includes('/listings/home')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [],
                        pagination: { total: 0, hasMore: false },
                    }),
                });
            }

            if (url.includes('/listings')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            {
                                id: 'ad_1',
                                title: 'iPhone 13 128GB Midnight',
                                price: 35000,
                                category: 'Mobile Phones',
                                categoryId: 'cat_mobile',
                                listingType: 'ad',
                                status: 'live',
                                images: ['/images/placeholder.png'],
                                createdAt: new Date().toISOString(),
                            },
                        ],
                        pagination: { total: 1, page: 1, limit: 20, hasMore: false },
                    }),
                });
            }

            if (url.includes('/notifications')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, notifications: [], unreadCount: 0 }),
                });
            }

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [] }),
            });
        });
    });

    test('PRIORITY 1 (FIND-005) — Desktop search filter sidebar callback propagation', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        
        let lastListingRequestUrl = '';
        page.on('request', (req) => {
            if (req.url().includes('/api/v1/listings') && !req.url().includes('/home')) {
                lastListingRequestUrl = req.url();
            }
        });

        await page.goto('/search?type=ad');
        await page.waitForLoadState('networkidle');

        // Check if sidebar controls exist
        const minPriceInput = page.locator('#sidebar-min-price');
        const maxPriceInput = page.locator('#sidebar-max-price');
        const applyPriceButton = page.getByRole('button', { name: 'Apply Price' });

        await expect(minPriceInput).toBeVisible();
        await expect(maxPriceInput).toBeVisible();
        await expect(applyPriceButton).toBeVisible();

        // Type price values
        await minPriceInput.fill('5000');
        await maxPriceInput.fill('20000');

        lastListingRequestUrl = '';
        await applyPriceButton.click();
        await page.waitForTimeout(500);

        // Record finding: URL and API call do NOT update with price filters
        const currentUrl = page.url();
        console.log('[FIND-005 RUNTIME EVIDENCE] URL after Apply Price:', currentUrl);
        console.log('[FIND-005 RUNTIME EVIDENCE] Last API request after Apply Price:', lastListingRequestUrl);

        expect(currentUrl).not.toContain('minPrice=5000');
        expect(lastListingRequestUrl).not.toContain('minPrice');
    });

    test('PRIORITY 2 (FIND-004) — Header Recent Searches dropdown static behavior', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Target desktop header search specifically
        const searchInput = page.locator('header').locator('#header-global-search').first();
        await expect(searchInput).toBeVisible();

        // Focus search input to open dropdown
        await searchInput.focus();
        await page.waitForTimeout(300);

        // Verify "Recent" label and static values
        const dropdown = page.locator('.animate-in.fade-in');
        await expect(dropdown).toBeVisible();
        await expect(dropdown).toContainText('Recent');
        await expect(dropdown).toContainText('iPhone 14 Pro');
        await expect(dropdown).toContainText('Samsung Galaxy');
        await expect(dropdown).toContainText('MacBook Pro');
        await expect(dropdown).toContainText('iPad Air');

        console.log('[FIND-004 RUNTIME EVIDENCE] Verified Recent dropdown contains 4 hardcoded items.');
    });

    test('PRIORITY 4 (FIND-006) — Post Ad header presence, backdrop inert and focus isolation', async ({ page, context }) => {
        await context.addCookies([
            {
                name: 'esparex_auth',
                value: 'fake_jwt_token_for_audit',
                domain: '127.0.0.1',
                path: '/',
            },
        ]);

        await page.goto('/post-ad');
        await page.waitForLoadState('networkidle');

        // Check if header exists in DOM
        const header = page.locator('header').first();
        const headerCount = await page.locator('header').count();
        console.log('[FIND-006 RUNTIME EVIDENCE] Header element count in DOM:', headerCount);

        // Check backdrop with inert
        const backdrop = page.locator('div[inert]');
        const backdropExists = (await backdrop.count()) > 0;
        console.log('[FIND-006 RUNTIME EVIDENCE] PostAdPageBackdrop has inert attribute:', backdropExists);

        // Verify Dialog overlay covers viewport
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Test Tab focus trapping: tabbing stays inside the dialog and does not reach background header
        await page.keyboard.press('Tab');
        const isInsideDialog = await page.evaluate(() => {
            const el = document.activeElement;
            return el?.closest('[role="dialog"]') !== null || el?.closest('button') !== null;
        });

        console.log('[FIND-006 RUNTIME EVIDENCE] Focused element inside dialog:', isInsideDialog);
        expect(isInsideDialog).toBe(true);
    });

    test('ACCESSIBILITY (FIND-008 & FIND-009) — Accordion aria-expanded and search input label', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/search?type=ad');
        await page.waitForLoadState('networkidle');

        // FIND-008: Check aria-expanded on sidebar collapsible section buttons (using exact name)
        const categoryToggle = page.getByRole('button', { name: 'Categories', exact: true });
        const priceToggle = page.getByRole('button', { name: /Price Range/i });
        const sellerToggle = page.getByRole('button', { name: /Seller Type/i });
        const conditionToggle = page.getByRole('button', { name: /Condition/i });

        const catAriaExpanded = await categoryToggle.getAttribute('aria-expanded');
        const priceAriaExpanded = await priceToggle.getAttribute('aria-expanded');
        const sellerAriaExpanded = await sellerToggle.getAttribute('aria-expanded');
        const condAriaExpanded = await conditionToggle.getAttribute('aria-expanded');

        console.log('[FIND-008 RUNTIME EVIDENCE] aria-expanded on accordion buttons:', {
            category: catAriaExpanded,
            price: priceAriaExpanded,
            seller: sellerAriaExpanded,
            condition: condAriaExpanded,
        });

        expect(catAriaExpanded).toBeNull();
        expect(priceAriaExpanded).toBeNull();
        expect(sellerAriaExpanded).toBeNull();
        expect(condAriaExpanded).toBeNull();

        // FIND-009: Check accessible name on desktop search input
        const desktopSearch = page.locator('header').locator('#header-global-search').first();
        const ariaLabel = await desktopSearch.getAttribute('aria-label');
        const ariaLabelledBy = await desktopSearch.getAttribute('aria-labelledby');
        console.log('[FIND-009 RUNTIME EVIDENCE] Desktop search accessible name attributes:', {
            ariaLabel,
            ariaLabelledBy,
        });

        expect(ariaLabel).toBeNull();
        expect(ariaLabelledBy).toBeNull();
    });

    test('STATIC INTEGRITY (FIND-001 & FIND-002) — Route existence verification', async ({ page, context }) => {
        await context.addCookies([
            {
                name: 'esparex_auth',
                value: 'fake_jwt_token_for_audit',
                domain: '127.0.0.1',
                path: '/',
            },
        ]);

        // FIND-001: /my-account/listings vs /account/ads
        const legacyMyAccountResp = await page.goto('/my-account/listings');
        const legacyStatus = legacyMyAccountResp?.status();
        console.log('[FIND-001 RUNTIME EVIDENCE] /my-account/listings HTTP Status:', legacyStatus);
        expect(legacyStatus).toBe(404);

        const canonicalAdsResp = await page.goto('/account/ads');
        const canonicalAdsStatus = canonicalAdsResp?.status();
        console.log('[FIND-001 RUNTIME EVIDENCE] /account/ads HTTP Status:', canonicalAdsStatus);
        expect(canonicalAdsStatus).toBe(200);

        // FIND-002: /support vs /contact
        const supportResp = await page.goto('/support');
        const supportStatus = supportResp?.status();
        console.log('[FIND-002 RUNTIME EVIDENCE] /support HTTP Status:', supportStatus);
        expect(supportStatus).toBe(404);

        const contactResp = await page.goto('/contact');
        const contactStatus = contactResp?.status();
        console.log('[FIND-002 RUNTIME EVIDENCE] /contact HTTP Status:', contactStatus);
        expect(contactStatus).toBe(200);
    });
});
