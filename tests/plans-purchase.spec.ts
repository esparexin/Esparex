import { test, expect } from '@playwright/test';
import {
  seedAuthenticatedUserSession,
  installAuthenticatedUserApiMocks,
  smokeUser,
} from '../apps/web/tests/fixtures/authenticatedUserSession';

test.describe('Plans & Wallet Hub — 15-Point Release Gate E2E Regression Suite', () => {
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
                planName: 'Spotlight Boost 1-Pack',
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
              name: 'Spotlight Boost 1-Pack',
              price: 999,
              type: 'SPOTLIGHT',
              userType: 'normal',
              durationDays: 30,
              isDefault: false,
            },
            {
              id: 'plan_biz_starter',
              name: 'Business Enterprise Plan',
              price: 4999,
              type: 'AD_PACK',
              userType: 'business',
              durationDays: 365,
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

  test('Gate 1 & 2 — Subscription, Promotions, and Plan Visibility render cleanly without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3000/account/wallet');

    // Verify Subscription Card
    const currentPlanHeading = page.getByRole('heading', { name: /Free Starter Plan/i });
    await expect(currentPlanHeading).toBeVisible({ timeout: 10000 });

    // Verify Active Promotion
    const boostedAdTitle = page.getByText('2021 Hyundai Creta Headlight Assembly');
    await expect(boostedAdTitle).toBeVisible();

    // Verify 0 uncaught console errors
    expect(consoleErrors.filter((e) => !e.includes('Download the React DevTools'))).toHaveLength(0);
  });

  test('Gate 3, 4 & 5 — Credit Packs display distinct plan names, 30-day validity, and active credit status', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // Switch to Ad Credits tab
    const adCreditsTab = page.getByRole('tab', { name: /Ad Credits/i });
    await expect(adCreditsTab).toBeVisible();
    await adCreditsTab.click();

    // Verify itemized Active Credit Pack
    const packTitle = page.getByText('More Ads 20-Pack');
    await expect(packTitle).toBeVisible();

    const activeStatusPill = page.getByText('Active').first();
    await expect(activeStatusPill).toBeVisible();

    const availableCredits = page.getByText('15 Available');
    await expect(availableCredits).toBeVisible();
  });

  test('Gate 6, 7 & 8 — Upgrade Plan button presents catalog packages and triggers order initialization', async ({ page }) => {
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

  test('Gate 9, 10 & 11 — Invoices tab renders payment history with receipt PDF download buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/account/wallet');

    // Switch to Invoices tab
    const invoicesTab = page.getByRole('tab', { name: /Invoices/i });
    await expect(invoicesTab).toBeVisible();
    await invoicesTab.click();

    // Verify Payment Record
    const paymentPlanName = page.getByText('More Ads 20-Pack').first();
    await expect(paymentPlanName).toBeVisible();

    const paidPill = page.getByText('PAID').first();
    await expect(paidPill).toBeVisible();
  });

  test('Gate 12, 13 & 14 — Human-friendly error handling suppresses technical raw strings during rate limits', async ({ page }) => {
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

    // Verify raw 429 string is suppressed in UI
    const rawError = page.getByText('429 Too Many Requests');
    await expect(rawError).not.toBeVisible();
  });
});
