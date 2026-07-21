import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.WEB_FRONTEND_PORT || 3000);
const baseURL = process.env.SMOKE_FRONTEND_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // CI: 2 retries to absorb infra flakiness; local: 0
    retries: process.env.CI ? 2 : 0,
    // CI: single worker (no live dev server); local: 4 workers for speed
    workers: process.env.CI ? 1 : 4,
    reporter: process.env.CI ? [['list'], ['github']] : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Increase action timeout for slower CI machines
        actionTimeout: process.env.CI ? 15_000 : 10_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],
    webServer: process.env.CI ? undefined : {
        // NEXT_PUBLIC_* vars are baked into the bundle at *build* time.
        // They must be prefixed on the build command — the env block below
        // only affects `npm run start` and has no effect on the compiled output.
        command: `NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL || `${baseURL}/api/v1`} npm run build && npm run start -- -H 127.0.0.1 -p ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
            BYPASS_POST_AD_QUOTA_CHECK: process.env.BYPASS_POST_AD_QUOTA_CHECK || 'true',
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || `${baseURL}/api/v1`,
            BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5001',
        },
    },
});

