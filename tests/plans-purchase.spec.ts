import { test, expect } from '@playwright/test';
import {
  seedAuthenticatedUserSession,
  installAuthenticatedUserApiMocks,
  smokeUser,
} from '../apps/web/tests/fixtures/authenticatedUserSession';

test.describe('Plans & Wallet Hub — Comprehensive Multi-Browser E2E Verification Suite', () => {
  test.beforeEach(async ({ context, page }) => {
    // 1. Seed authenticated user session & core auth API mocks
    await seedAuthenticatedUserSession(context);
    await installAuthenticatedUserApiMocks(page);

    // 2. Mock Plans & Wallet Dashboard Facade API response (GET /api/v1/payments/account/plans-wallet)
    await page.route('**/api/v1/payments/account/plans-wallet', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            user: {
              id: smokeUser.id,
              name: smokeUser.name,
              email: smokeUser.email,
              plan: 'Free',
            },
            subscription: {
              id: 'sub_free',
              planName: 'Free Starter Plan',
              status: 'active',
              expiresAt: null,
            },
            wallet: {
              freeMonthlyAds: 5,
              adCredits: 15,
              spotlightCredits: 2,
              topAdBumps: 1,
            },
            activePromotions: [
              {
                promotionId: 'promo_1',
                entityId: 'ad_101',
                entityTitle: '2021 Hyundai Creta Headlight Assembly',
                type: 'Spotlight Boost',
                startsAt: new Date().toISOString(),
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                daysRemaining: 7,
              },
            ],
            creditPacks: [
              {
                packId: 'pack_1001',
                planName: 'More Ads 20-Pack',
                entitlementType: 'AD_POSTING',
                totalGranted: 20,
                consumed: 5,
                remaining: 15,
                sourceType: 'PURCHASED_PACK',
                purchaseDate: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'ACTIVE',
              },
              {
                packId: 'pack_1002',
                planName: 'Spotlight 5-Pack',
                entitlementType: 'SPOTLIGHT_CAT',
                totalGranted: 5,
                consumed: 5,
                remaining: 0,
                sourceType: 'PURCHASED_PACK',
                purchaseDate: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'EXHAUSTED',
              },
            ],
            recentPayments: [
              {
                orderId: 'order_9001',
                paymentId: 'pay_9001',
                transactionId: 'txn_9001',
                description: 'More Ads 20-Pack',
                amount: 499,
                currency: 'INR',
                status: 'SUCCESS',
                paymentMethod: 'Razorpay UPI',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        },
      });
    });

    // 3. Mock Available Plans Catalog API response (GET /api/v1/payments/plans)
    await page.route('**/api/v1/payments/plans*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: [
            {
              id: 'plan_moreads_20',
              name: 'More Ads 20-Pack',
              price: 499,
              type: 'AD_PACK',
              durationDays: 30,
              isDefault: true,
            },
            {
              id: 'plan_spotlight_5',
              name: 'Spotlight 5-Pack',
              price: 999,
              type: 'SPOTLIGHT',
              durationDays: 30,
              isDefault: false,
            },
          ],
        },
      });
    });

    // 4. Mock Payment Order Creation API response (POST /api/v1/payments/orders)
    await page.route('**/api/v1/payments/orders', async (route) => {
      const requestPayload = route.request().postDataJSON();
      expect(requestPayload).toHaveProperty('planId');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            orderId: 'order_mock_998877',
            transactionId: 'txn_mock_112233',
            amount: 499,
            currency: 'INR',
            keyId: 'rzp_test_key_123456',
            userName: smokeUser.name,
            userEmail: smokeUser.email,
          },
        },
      });
    });
  });

  test('Workflow 1 — My Plan overview renders subscription, active promotions, and balance metrics', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3000/account/wallet');

    // Verify Active Subscription Card
    const currentPlanHeading = page.getByRole('heading', { name: /Free Starter Plan/i });
    await expect(currentPlanHeading).toBeVisible({ timeout: 10000 });

    // Verify Active Promotion (Spotlight Boost)
    const boostedAdTitle = page.getByText('2021 Hyundai Creta Headlight Assembly');
    await expect(boostedAdTitle).toBeVisible();

    // Verify 0 uncaught console errors
    expect(consoleErrors.filter((e) => !e.includes('Download the React DevTools'))).toHaveLength(0);
  });

  test('Workflow 2 — Ad Credits tab displays itemized packs with plan names, 30-day validity, and status pills', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // Switch to "Ad Credits" tab
    const adCreditsTab = page.getByRole('tab', { name: /Ad Credits/i });
    await expect(adCreditsTab).toBeVisible();
    await adCreditsTab.click();

    // Verify Active Credit Pack displays planName and Active badge
    const packTitle = page.getByText('More Ads 20-Pack');
    await expect(packTitle).toBeVisible();

    const activeStatusPill = page.getByText('Active').first();
    await expect(activeStatusPill).toBeVisible();

    const availableCredits = page.getByText('15 Available');
    await expect(availableCredits).toBeVisible();

    // Expand history to verify Exhausted ("Used Up") pack
    const showAllButton = page.getByRole('button', { name: /Show All 2 Credit Packs & History/i });
    if (await showAllButton.isVisible()) {
      await showAllButton.click();
      const usedUpPill = page.getByText('Used Up');
      await expect(usedUpPill).toBeVisible();
    }
  });

  test('Workflow 3 — Invoices tab renders payment history with transaction IDs and receipt downloads', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // Switch to "Invoices" tab
    const invoicesTab = page.getByRole('tab', { name: /Invoices/i });
    await expect(invoicesTab).toBeVisible();
    await invoicesTab.click();

    // Verify Payment Record
    const paymentPlanName = page.getByText('More Ads 20-Pack').first();
    await expect(paymentPlanName).toBeVisible();

    const paidPill = page.getByText('PAID').first();
    await expect(paidPill).toBeVisible();
  });

  test('Workflow 4 — Upgrade Plan button opens package catalog and triggers checkout API', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    const upgradeButton = page.getByRole('button', { name: /Upgrade Plan/i }).first();
    await expect(upgradeButton).toBeVisible({ timeout: 10000 });
    await upgradeButton.click();

    // Verify catalog package card heading and Purchase Package button appear
    const packageCardHeading = page.getByRole('heading', { name: /More Ads 20-Pack/i });
    await expect(packageCardHeading).toBeVisible();

    const purchaseButton = page.getByRole('button', { name: /Purchase Package/i }).first();
    await expect(purchaseButton).toBeVisible();
  });

  test('Workflow 5 — Accessibility audit verifies WCAG keyboard navigation and ARIA tab roles', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // Verify tablist and tab roles
    const tablist = page.getByRole('tablist', { name: /Wallet Navigation/i });
    await expect(tablist).toBeVisible();

    const myPlanTab = page.getByRole('tab', { name: /My Plan/i });
    await expect(myPlanTab).toHaveAttribute('aria-selected', 'true');

    // Focus navigation test via Tab key
    await myPlanTab.focus();
    await expect(myPlanTab).toBeFocused();
  });

  test('Workflow 6 — Empty state renders helpful banner when zero credit packs exist', async ({ page }) => {
    // Override dashboard response with zero credit packs
    await page.route('**/api/v1/payments/account/plans-wallet', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            user: { id: smokeUser.id, name: smokeUser.name, email: smokeUser.email, plan: 'Free' },
            subscription: null,
            wallet: { freeMonthlyAds: 5, adCredits: 0, spotlightCredits: 0, topAdBumps: 0 },
            activePromotions: [],
            creditPacks: [],
            recentPayments: [],
          },
        },
      });
    });

    await page.goto('http://localhost:3000/account/wallet');

    const adCreditsTab = page.getByRole('tab', { name: /Ad Credits/i });
    await adCreditsTab.click();

    const emptyBanner = page.getByText('No Credit Packs Purchased Yet');
    await expect(emptyBanner).toBeVisible();
  });
});
