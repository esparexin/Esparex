import { test, expect } from '@playwright/test';

test.describe('Plans & Wallet Hub — Purchase Flow E2E Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Plans & Wallet Dashboard Facade API response (GET /api/v1/payments/account/plans-wallet)
    await page.route('**/api/v1/payments/account/plans-wallet', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            user: {
              id: 'usr_test_123',
              name: 'John Seller',
              email: 'seller@esparex.com',
              plan: 'Free',
            },
            subscription: {
              id: 'sub_free',
              planName: 'Free Tier',
              status: 'active',
              expiresAt: null,
            },
            wallet: {
              freeMonthlyAds: 5,
              adCredits: 10,
              spotlightCredits: 2,
              topAdBumps: 1,
            },
            activePromotions: [],
            creditPacks: [],
          },
        },
      });
    });

    // Mock Available Plans Catalog API response (GET /api/v1/payments/plans)
    await page.route('**/api/v1/payments/plans*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: [
            {
              id: 'plan_boost_10',
              name: 'New_user_Plan_10',
              price: 0,
              type: 'BOOST_AD',
              durationDays: 30,
              isDefault: false,
            },
            {
              id: 'plan_spotlight_10',
              name: 'New_user_Plan_10',
              price: 0,
              type: 'SPOTLIGHT',
              durationDays: 30,
              isDefault: false,
            },
            {
              id: 'plan_moreads_20',
              name: 'New_user_Plan_20',
              price: 0,
              type: 'AD_PACK',
              durationDays: 30,
              isDefault: true,
            },
          ],
        },
      });
    });

    // Mock Payment Order Creation API response (POST /api/v1/payments/orders)
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
            userName: 'John Seller',
            userEmail: 'seller@esparex.com',
          },
        },
      });
    });
  });

  test('User can open Buy Plans sub-tab and click Purchase Package to open confirmation modal', async ({ page }) => {
    // 1. Navigate to Account Plans page
    await page.goto('http://localhost:3000/account/plans');

    // 2. Locate the "Buy Plans & Top-ups" tab trigger and click it
    const buyPlansTabTrigger = page.getByRole('button', { name: /Buy Plans/i });
    if (await buyPlansTabTrigger.isVisible()) {
      await buyPlansTabTrigger.click();
    }

    // 3. Locate "Purchase Package" button for a plan card
    const purchaseButton = page.getByRole('button', { name: /Purchase Package/i }).first();
    await expect(purchaseButton).toBeVisible();

    // 4. Click "Purchase Package" button
    await purchaseButton.click();

    // 5. Verify that PlanPurchaseDialog modal opens
    const dialogTitle = page.getByRole('heading', { name: /Confirm Purchase/i });
    await expect(dialogTitle).toBeVisible();

    // 6. Verify "Confirm & Pay" button exists inside the modal
    const confirmButton = page.getByRole('button', { name: /Confirm & Pay/i });
    await expect(confirmButton).toBeVisible();
  });

  test('Clicking Confirm & Pay sends POST request to /api/v1/payments/orders', async ({ page }) => {
    await page.goto('http://localhost:3000/account/plans');

    const buyPlansTabTrigger = page.getByRole('button', { name: /Buy Plans/i });
    if (await buyPlansTabTrigger.isVisible()) {
      await buyPlansTabTrigger.click();
    }

    const purchaseButton = page.getByRole('button', { name: /Purchase Package/i }).first();
    await purchaseButton.click();

    // Intercept POST request when user confirms purchase
    const orderRequestPromise = page.waitForRequest(
      (request) => request.url().includes('/api/v1/payments/orders') && request.method() === 'POST'
    );

    const confirmButton = page.getByRole('button', { name: /Confirm & Pay/i });
    await confirmButton.click();

    const orderRequest = await orderRequestPromise;
    expect(orderRequest.method()).toBe('POST');
    expect(orderRequest.headers()['content-type']).toContain('application/json');
  });
});
