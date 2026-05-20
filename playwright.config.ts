/**
 * Playwright E2E configuration for Forge.
 *
 * PREREQUISITE (one-time manual setup):
 *   npx playwright install chromium
 *
 * Run E2E tests:
 *   npm run e2e         — headless, all journeys
 *   npm run e2e:ui      — interactive UI mode
 *   npm run e2e:pwa     — PWA/offline tests (placeholder; no specs yet)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/pwa/**',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
