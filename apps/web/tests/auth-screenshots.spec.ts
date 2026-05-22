import { test, expect } from '@playwright/test';
import {
  fulfillJson,
  installAuthenticatedUserApiMocks,
  seedAuthenticatedUserSession,
} from "./fixtures/authenticatedUserSession";

test('Auth and capture account pages', async ({ page }) => {
  await seedAuthenticatedUserSession(page.context());
  await installAuthenticatedUserApiMocks(page);
  await page.route(/\/api\/v1\/notifications(\?.*)?$/, (route) =>
    fulfillJson(route, { success: true, data: { items: [], total: 0 } })
  );
  await page.route(/\/api\/v1\/chat\/list(\?.*)?$/, (route) =>
    fulfillJson(route, { success: true, data: { conversations: [], total: 0 } })
  );

  await page.goto('/account/settings', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Notification Settings' }).first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'playwright-account-settings.png', fullPage: true });

  await page.goto('/account/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Personal Information' }).first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'playwright-account-profile.png', fullPage: true });
});
