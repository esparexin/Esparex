import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ADMIN_FRONTEND_PORT || 3001);
const baseURL = process.env.ADMIN_FRONTEND_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- -H 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_ADMIN_API_URL:
        process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://127.0.0.1:5000/api/v1/admin"
    }
  }
});
