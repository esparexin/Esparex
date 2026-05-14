import { expect, test } from '@playwright/test';

const AUTH_COOKIE = 'admin_token=e2e-admin-token; Path=/; HttpOnly; SameSite=Lax';
const CLEAR_AUTH_COOKIE = 'admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

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

const catalogRequestItems = [
  {
    id: '65fa29c9d2c1f2e165fa29c1',
    requestType: 'brand',
    categoryId: '65fa29c9d2c1f2e165fa29d1',
    requestedName: 'Acme',
    canonicalName: 'acme',
    slug: 'acme',
    requestedBy: { id: 'u1', firstName: 'A', lastName: 'User', email: 'a@example.com' },
    status: 'pending',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: '65fa29c9d2c1f2e165fa29c2',
    requestType: 'model',
    categoryId: '65fa29c9d2c1f2e165fa29d1',
    parentBrandId: '65fa29c9d2c1f2e165fa29e1',
    requestedName: 'Acme One',
    canonicalName: 'acme one',
    slug: 'acme-one',
    requestedBy: { id: 'u2', firstName: 'B', lastName: 'User', email: 'b@example.com' },
    status: 'pending',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
];

const paginated = (items: unknown[]) => ({
  success: true,
  data: { items },
  meta: {
    pagination: {
      page: 1,
      limit: 20,
      total: items.length,
      pages: 1,
      totalPages: 1,
    },
  },
});

test('bulk reject modal submits mandatory reason', async ({ page }) => {
  let rejectPayload: Record<string, unknown> | null = null;
  let isLoggedIn = false;

  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/login') && method === 'POST') {
      isLoggedIn = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': AUTH_COOKIE },
        body: JSON.stringify(buildAdminPayload()),
      });
      return;
    }
    if (path.endsWith('/logout') && method === 'POST') {
      isLoggedIn = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': CLEAR_AUTH_COOKIE },
        body: JSON.stringify({ success: true, data: {} }),
      });
      return;
    }
    if (path.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isLoggedIn ? buildAdminPayload() : { success: true, data: {} }),
      });
      return;
    }
    if (path.endsWith('/catalog-requests/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 2,
            byStatus: { pending: 2, approved: 0, rejected: 0, duplicate: 0, total: 2 },
            byRequestType: {
              brand: { pending: 1, approved: 0, rejected: 0, duplicate: 0, total: 1 },
              model: { pending: 1, approved: 0, rejected: 0, duplicate: 0, total: 1 },
            },
          },
        }),
      });
      return;
    }
    if (path.endsWith('/catalog-requests') && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(catalogRequestItems)) });
      return;
    }
    if (path.endsWith('/catalog/categories') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: '65fa29c9d2c1f2e165fa29d1', name: 'Phones' }])),
      });
      return;
    }
    if (path.endsWith('/catalog/brands') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: '65fa29c9d2c1f2e165fa29e1', name: 'Acme' }])),
      });
      return;
    }
    if (path.endsWith('/catalog-requests/bulk/reject') && method === 'POST') {
      rejectPayload = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { results: [{ id: '65fa29c9d2c1f2e165fa29c1', status: 'success' }] },
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });

  await page.goto('/login?next=%2Fcatalog-requests');
  await expect(page.locator('#admin-login-email')).toBeVisible({ timeout: 60000 });
  await page.locator('#admin-login-email').fill('admin@example.com');
  await page.locator('#admin-login-password').fill('Admin@123456');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/catalog-requests/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Catalog Requests' })).toBeVisible();

  await page.locator('tbody input[type="checkbox"]').first().check();
  const quickRejectButton = page.getByRole('button', { name: 'Quick Reject' });
  await expect(quickRejectButton).toBeEnabled();
  await quickRejectButton.click();

  await expect(page.getByRole('dialog')).toContainText('Bulk Reject Requests');
  await page.getByPlaceholder('Explain why these requests are being rejected').fill('Invalid naming format');
  await page.getByRole('button', { name: 'Reject Selected' }).click();

  await expect
    .poll(() => rejectPayload)
    .toMatchObject({ requestIds: ['65fa29c9d2c1f2e165fa29c1'], reason: 'Invalid naming format' });
});

test('bulk duplicate modal submits selected canonical target', async ({ page }) => {
  let duplicatePayload: Record<string, unknown> | null = null;
  let isLoggedIn = false;

  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/login') && method === 'POST') {
      isLoggedIn = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': AUTH_COOKIE },
        body: JSON.stringify(buildAdminPayload()),
      });
      return;
    }
    if (path.endsWith('/logout') && method === 'POST') {
      isLoggedIn = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'set-cookie': CLEAR_AUTH_COOKIE },
        body: JSON.stringify({ success: true, data: {} }),
      });
      return;
    }
    if (path.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isLoggedIn ? buildAdminPayload() : { success: true, data: {} }),
      });
      return;
    }
    if (path.endsWith('/catalog-requests/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 1,
            byStatus: { pending: 1, approved: 0, rejected: 0, duplicate: 0, total: 1 },
            byRequestType: {
              brand: { pending: 1, approved: 0, rejected: 0, duplicate: 0, total: 1 },
              model: { pending: 0, approved: 0, rejected: 0, duplicate: 0, total: 0 },
            },
          },
        }),
      });
      return;
    }
    if (path.endsWith('/catalog-requests') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated([catalogRequestItems[0]])),
      });
      return;
    }
    if (path.endsWith('/catalog/categories') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: '65fa29c9d2c1f2e165fa29d1', name: 'Phones' }])),
      });
      return;
    }
    if (path.endsWith('/catalog/brands') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated([{ id: '65fa29c9d2c1f2e165fa29e1', name: 'Acme', canonicalName: 'acme' }])),
      });
      return;
    }
    if (path.endsWith('/catalog-requests/bulk/mark-duplicate') && method === 'POST') {
      duplicatePayload = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { results: [{ id: '65fa29c9d2c1f2e165fa29c1', status: 'success' }] },
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });

  await page.goto('/login?next=%2Fcatalog-requests');
  await expect(page.locator('#admin-login-email')).toBeVisible({ timeout: 60000 });
  await page.locator('#admin-login-email').fill('admin@example.com');
  await page.locator('#admin-login-password').fill('Admin@123456');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/catalog-requests/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Catalog Requests' })).toBeVisible();

  await page.locator('tbody input[type="checkbox"]').first().check();
  const quickDuplicateButton = page.getByRole('button', { name: 'Quick Duplicate' });
  await expect(quickDuplicateButton).toBeEnabled();
  await quickDuplicateButton.click();

  await expect(page.getByRole('dialog')).toContainText('Bulk Mark As Duplicate');
  await page.getByPlaceholder('Type at least 2 characters to search brands').fill('Ac');
  await page.getByRole('button', { name: /Acme/i }).first().click();
  await page.getByRole('button', { name: 'Mark Selected' }).click();

  await expect
    .poll(() => duplicatePayload)
    .toMatchObject({ requestIds: ['65fa29c9d2c1f2e165fa29c1'], duplicateOfId: '65fa29c9d2c1f2e165fa29e1' });
});
