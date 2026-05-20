import { test, expect } from '@playwright/test';

const ADMIN_BASE_URL = process.env.ADMIN_FRONTEND_BASE_URL || 'http://127.0.0.1:3001';

const buildAdminPayload = () => ({
  success: true,
  data: {
    admin: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      name: 'Test Admin',
      permissions: ['*'],
    },
  },
});

test.describe('UI Composition Standards', () => {
  test.beforeEach(async ({ page }) => {
    const hostname = new URL(ADMIN_BASE_URL).hostname;
    await page.context().addCookies([
      {
        name: "admin_token",
        value: "e2e-admin-token",
        domain: hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax"
      }
    ]);

    await page.route('**/api/v1/admin/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildAdminPayload()),
        });
        return;
      }
      if (path.includes('/categories') || path.includes('/brands') || path.includes('/models') || path.includes('/catalog-requests')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.goto('/categories?tab=device-categories');
  });

  test('Device Catalog page renders tab navigation exactly once', async ({ page }) => {
    // Ensure the page is loaded
    await page.waitForSelector('text=Device Categories');

    // Rule: Shared UI components such as module tabs must be rendered only once at the page layout level.
    const tablists = await page.getByRole('tablist');
    const count = await tablists.count();
    
    expect(count).toBe(1);
  });

  test('Shared tab labels appear only once within the tablist', async ({ page }) => {
    const tablist = page.getByRole('tablist');
    
    // Check for specific tab labels, waiting for them to be visible (auto-waits!)
    await expect(tablist.getByText('Device Categories', { exact: true })).toBeVisible();
    await expect(tablist.getByText('Brands', { exact: true })).toBeVisible();
    await expect(tablist.getByText('Models', { exact: true })).toBeVisible();

    // Now that they are loaded, assert their exact counts
    expect(await tablist.getByText('Device Categories', { exact: true }).count()).toBe(1);
    expect(await tablist.getByText('Brands', { exact: true }).count()).toBe(1);
    expect(await tablist.getByText('Models', { exact: true }).count()).toBe(1);
  });

  test('Active tab content is properly nested under its own section header', async ({ page }) => {
    // The main page header should be "Device Catalog" (H1) inside main content
    const pageHeader = page.getByRole('main').getByRole('heading', { level: 1 });
    await expect(pageHeader).toHaveText('Device Catalog');

    // The active tab content header should be "Categories" (H2) inside main content
    const sectionHeader = page.getByRole('main').getByRole('heading', { level: 2 });
    await expect(sectionHeader).toContainText('Categories');
  });
});
