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
  let isLoggedIn = false;

  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path.endsWith("/login") && method === "POST") {
      isLoggedIn = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildAdminPayload())
      });
      return;
    }

    if (path.endsWith("/logout") && method === "POST") {
      isLoggedIn = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
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
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "Not mocked" })
    });
  });

  await page.goto("/login?next=https%3A%2F%2Fevil.example");
  await page.getByPlaceholder("Email").fill("admin@example.com");
  await page.getByPlaceholder("Password").fill("Admin@123456");
  await page.getByRole("button", { name: "Sign in" }).click();

  // External next targets are blocked and must fall back to internal dashboard.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});
