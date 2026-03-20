import { test, expect } from '@playwright/test';

test('Auth and capture account pages', async ({ page }) => {
  // Use localhost dev server
  const base = 'http://127.0.0.1:3000';
  const apiBase = 'http://127.0.0.1:5000/api/v1';

  // Instead of interacting with flaky OTP UI, call backend verify and set cookie directly.
  const mobile = '9030787819';
  const otp = '123456';

  // 1) Fetch CSRF token (if provided) to include in verify request
  let csrf: string | null = null;
  try {
    const r = await page.request.get(`${apiBase}/csrf-token`);
    const json = await r.json().catch(() => null);
    csrf = json?.csrfToken || null;
  } catch (e) {
    // ignore - backend may not require CSRF in test env
  }

  // 2) Call verify OTP endpoint directly
  const verifyRes = await page.request.post(`${apiBase}/auth/verify-otp`, {
    data: { mobile, otp },
    headers: csrf ? { 'x-csrf-token': csrf } : undefined
  });

  const body = await verifyRes.json().catch(() => ({}));
  const token = body.token || body.data?.token;
  if (!token) {
    throw new Error('Verify OTP did not return token; backend response: ' + JSON.stringify(body));
  }

  // 3) Set auth cookie in browser context so the app is authenticated
  await page.context().addCookies([
    {
      name: 'esparex_auth',
      value: token,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60
    }
  ]);

  // 4) Navigate to account pages and capture screenshots
  await page.goto(`${base}/account/settings`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'playwright-account-settings.png', fullPage: true });

  await page.goto(`${base}/account/profile`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'playwright-account-profile.png', fullPage: true });

  // Basic assertion: page contains Account Management header
  await expect(page.locator('text=Account Management').first()).toBeVisible();
});
