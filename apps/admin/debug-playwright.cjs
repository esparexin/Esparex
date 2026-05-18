const { chromium } = require('@playwright/test');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Set the admin_token cookie
  await context.addCookies([
    {
      name: "admin_token",
      value: "e2e-admin-token",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }
  ]);

  const page = await context.newPage();
  
  // Log browser console messages and errors
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.stack || err.message));
  
  // Also mock API requests
  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    
    if (path.endsWith("/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
        })
      });
      return;
    }
    
    // Default mock for all admin APIs
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} })
    });
  });

  console.log("Navigating to dashboard...");
  await page.goto("http://localhost:3001/dashboard");
  
  console.log("Waiting 5 seconds for page load and hydration...");
  await page.waitForTimeout(5000);
  
  const content = await page.innerHTML('main');
  console.log("MAIN CONTENT INNER HTML SIZE:", content.length);
  console.log("MAIN CONTENT:", content);

  console.log("Closing browser.");
  await browser.close();
})();
