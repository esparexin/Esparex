import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ADMIN_FRONTEND_PORT || 3001);
const baseURL = process.env.ADMIN_FRONTEND_BASE_URL || `http://127.0.0.1:${port}`;
const isCI = !!process.env.CI;
const useProdServerInCI = isCI && process.env.PLAYWRIGHT_CI_SERVER_MODE === "prod";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 120000,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
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
    command: "npm run build && npm run start -- -H 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_ADMIN_API_URL: "/api/v1/admin"
    }
  }
});
