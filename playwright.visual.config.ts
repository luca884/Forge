/**
 * Playwright configuration for Forge — visual regression screenshots.
 *
 * Serves the static production build (`dist/forge/browser`) on :8081 and
 * compares against baselines stored in e2e/visual/screens.spec.ts-snapshots/.
 *
 * The baselines are generated inside the official Playwright Docker image so
 * the rendering is identical on every machine. The host `node_modules` is
 * macOS-only (native esbuild binaries do not run in the Linux container), so
 * the app is built on the host and only Playwright runs in the container.
 *
 * Run:
 *   npm run e2e:visual          — build, then compare against the baselines
 *   npm run e2e:visual:update   — build, then regenerate the baselines
 *
 * PREREQUISITE: Docker, with `docker pull mcr.microsoft.com/playwright:v1.60.0-noble`.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/visual',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: 'http://localhost:8081',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    // The service worker would cache a stale build between runs.
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    // -P proxies unknown paths back to the root, giving deep links the SPA fallback.
    command: 'npx -y http-server@14.1.1 -p 8081 -c-1 -P "http://localhost:8081?" dist/forge/browser',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
