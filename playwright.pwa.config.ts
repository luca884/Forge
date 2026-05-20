/**
 * Playwright E2E configuration for Forge — PWA / offline mode.
 *
 * Uses a production build served on :8080 with an active service worker.
 * Runs offline scenarios (J14.1–J14.3) against the real SW cache.
 *
 * PREREQUISITE: npx playwright install chromium
 *
 * Run:
 *   npm run e2e:pwa     — builds + serves production bundle then runs offline specs
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/pwa',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 180_000,
  use: {
    baseURL: 'http://localhost:8080',
    ...devices['Pixel 5'],
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev:pwa',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
