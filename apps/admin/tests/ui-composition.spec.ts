import { test, expect } from '@playwright/test';

test.describe('UI Composition Standards', () => {
  test.beforeEach(async ({ page }) => {
    // We assume the admin is already logged in or we use a session
    // For this environment, we might need to bypass auth or use existing session if available
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
    
    // Check for a specific tab label that was duplicated before
    const categoryTabs = await tablist.getByText('Device Categories', { exact: true });
    expect(await categoryTabs.count()).toBe(1);

    const brandTabs = await tablist.getByText('Brands', { exact: true });
    expect(await brandTabs.count()).toBe(1);

    const modelTabs = await tablist.getByText('Models', { exact: true });
    expect(await modelTabs.count()).toBe(1);
  });

  test('Active tab content is properly nested under its own section header', async ({ page }) => {
    // The main page header should be "Device Catalog" (H1)
    const pageHeader = page.locator('h1');
    await expect(pageHeader).toHaveText('Device Catalog');

    // The active tab content header should be "Categories" (H2)
    const sectionHeader = page.locator('h2');
    await expect(sectionHeader).toContainText('Categories');
  });
});
