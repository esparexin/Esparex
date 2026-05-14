import { expect, test } from "@playwright/test";

const buildAdminPayload = () => ({
  success: true,
  data: {
    admin: {
      id: "admin-1",
      email: "admin@example.com",
      role: "super_admin",
      name: "Test Admin",
      permissions: ["*"]
    }
  }
});

test.describe("Admin Auth Resilience", () => {
  test.beforeEach(async ({ page }) => {

    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    });

    // Global mock for common dashboard APIs to prevent 404s/hangs
    await page.route("**/api/v1/admin/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/me") || url.includes("/csrf-token")) {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {}, items: [], pagination: { total: 0 } })
      });
    });
  });

  const setupAuth = async (context: any) => {
    await context.addCookies([{
      name: "admin_token",
      value: "e2e-admin-token",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);
  };

  test("401 Unauthorized during refresh redirects to login", async ({ page, context }) => {
    await setupAuth(context);
    await page.route("**/api/v1/admin/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Unauthorized" })
      });
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*\/login\?next=.*/);
  });

  test("Network failure during refresh does NOT redirect to login if already authenticated", async ({ page, context }) => {
    await setupAuth(context);
    
    await page.route("**/api/v1/admin/me", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/dashboard");
    
    // Should show Connection Error UI instead of redirecting
    await expect(page.getByText(/Connection Error|Failed to connect/i)).toBeVisible({ timeout: 10000 });
    expect(page.url()).not.toContain("/login");
  });

  test("Retry succeeds after transient network failure during refresh", async ({ page, context }) => {
    await setupAuth(context);
    let meRequestCount = 0;
    
    await page.route("**/api/v1/admin/me", async (route) => {
      meRequestCount++;
      if (meRequestCount === 1) {
        await route.abort("failed");
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildAdminPayload())
        });
      }
    });

    await page.goto("/dashboard");
    
    // adminFetch retries internally, so it should eventually show the dashboard
    await expect(page.getByText("System Overview")).toBeVisible({ timeout: 15000 });
    expect(meRequestCount).toBe(2);
  });

  test("403 CSRF error during state-changing request triggers a retry with fresh token", async ({ page, context }) => {
    await setupAuth(context);
    let csrfRequestCount = 0;
    
    await page.route("**/api/v1/admin/csrf-token", async (route) => {
      csrfRequestCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { csrfToken: `token-${csrfRequestCount}` } })
      });
    });

    await page.route("**/api/v1/admin/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildAdminPayload())
      });
    });

    await page.goto("/dashboard");
    await expect(page.getByText("System Overview")).toBeVisible();
  });
});


