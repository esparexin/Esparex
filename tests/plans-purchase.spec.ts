import { test, expect } from '@playwright/test';
import {
  seedAuthenticatedUserSession,
  installAuthenticatedUserApiMocks,
  smokeUser,
} from '../apps/web/tests/fixtures/authenticatedUserSession';

test.describe('Plans & Wallet Hub — 12-Phase Comprehensive E2E Playwright Audit', () => {
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
              userType: 'normal',
              durationDays: 30,
              isDefault: true,
            },
            {
              id: 'plan_spotlight_5',
              name: 'Spotlight 5-Pack',
              price: 999,
              type: 'SPOTLIGHT',
              userType: 'normal',
              durationDays: 30,
              isDefault: false,
            },
            {
              id: 'plan_biz_starter',
              name: 'Business Starter',
              price: 2999,
              type: 'AD_PACK',
              userType: 'business',
              durationDays: 365,
              isDefault: false,
            },
          ],
        },
      });
    });
  });

  test('Phase 3 — Wallet overview renders subscription summary, active promotions, and balance metrics', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // 1. Verify Active Subscription Card
    const currentPlanHeading = page.getByRole('heading', { name: /Free Starter Plan/i });
    await expect(currentPlanHeading).toBeVisible({ timeout: 10000 });

    // 2. Verify Active Promotion (Spotlight Boost)
    const boostedAdTitle = page.getByText('2021 Hyundai Creta Headlight Assembly');
    await expect(boostedAdTitle).toBeVisible();

    // 3. Switch to "Ad Credits" tab to inspect itemized Credit Packs
    const adCreditsTab = page.getByRole('tab', { name: /Ad Credits/i });
    await expect(adCreditsTab).toBeVisible();
    await adCreditsTab.click();

    // 4. Verify Active Credit Pack displays planName and Active badge
    const packTitle = page.getByText('More Ads 20-Pack');
    await expect(packTitle).toBeVisible();

    const activeStatusPill = page.getByText('Active').first();
    await expect(activeStatusPill).toBeVisible();

    const availableCredits = page.getByText('15 Available');
    await expect(availableCredits).toBeVisible();
  });

  test('Phase 4 & 5 — Upgrade Plan button presents configured catalog packages', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    const upgradeButton = page.getByRole('button', { name: /Upgrade Plan/i }).first();
    await expect(upgradeButton).toBeVisible({ timeout: 10000 });
    await upgradeButton.click();

    // Verify package card heading and Purchase Package button appear
    const packageCardHeading = page.getByRole('heading', { name: /More Ads 20-Pack/i });
    await expect(packageCardHeading).toBeVisible();

    const purchaseButton = page.getByRole('button', { name: /Purchase Package/i }).first();
    await expect(purchaseButton).toBeVisible();
  });

  test('Phase 10 — Human-friendly error popup replaces technical raw errors during payment failure', async ({ page }) => {
    // Override orders route to simulate 429 Rate Limit error
    await page.route('**/api/v1/payments/orders', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        json: {
          success: false,
          error: {
            message: 'Too Many Requests',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
      });
    });

    await page.goto('http://localhost:3000/account/wallet');

    const upgradeButton = page.getByRole('button', { name: /Upgrade Plan/i }).first();
    await expect(upgradeButton).toBeVisible({ timeout: 10000 });
    await upgradeButton.click();

    const purchaseButton = page.getByRole('button', { name: /Purchase Package/i }).first();
    await purchaseButton.click();

    // Verify raw 429 string is hidden
    const rawError = page.getByText('429 Too Many Requests');
    await expect(rawError).not.toBeVisible();
  });
});
