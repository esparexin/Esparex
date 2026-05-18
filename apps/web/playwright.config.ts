import { defineConfig, devices } from '@playwright/test';

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
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
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
});
