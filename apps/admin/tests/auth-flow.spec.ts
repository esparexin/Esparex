import { expect, test } from "@playwright/test";

const ADMIN_BASE_URL = process.env.ADMIN_FRONTEND_BASE_URL || "http://127.0.0.1:3001";
const CLEAR_AUTH_COOKIE = "admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

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

test("redirects unauthenticated dashboard access to login", async ({ page }) => {
  await page.route("**/api/v1/admin/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} })
      });
      return;
    }
    if (path.endsWith("/stats")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Unauthorized" })
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "Not mocked" })
    });
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("supports login, safe redirect handling, and logout", async ({ page }) => {
  let isLoggedIn = true;
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

  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path.endsWith("/logout") && method === "POST") {
      isLoggedIn = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "set-cookie": CLEAR_AUTH_COOKIE },
        body: JSON.stringify({ success: true, data: { message: "Logged out" } })
      });
      return;
    }

    if (path.endsWith("/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isLoggedIn ? buildAdminPayload() : { success: true, data: {} })
      });
      return;
    }

    if (path.endsWith("/stats")) {
      await route.fulfill({
        status: isLoggedIn ? 200 : 401,
        contentType: "application/json",
        body: JSON.stringify(
          isLoggedIn
            ? { success: true, data: { pendingAds: 2, totalUsers: 8 } }
            : { success: false, error: "Unauthorized" }
        )
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} })
    });
  });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

  await page.goto("/login?next=https%3A%2F%2Fevil.example");
  // Already-authenticated admin visiting login with external next must be redirected
  // to an internal-safe path (/dashboard).
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "System Overview" })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});
