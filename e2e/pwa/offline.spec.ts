/**
 * J14 — Offline + Service Worker smoke tests.
 *
 * Runs against a production build served on :8080 with an active service worker.
 * Configured via playwright.pwa.config.ts (separate from the dev-server suite).
 *
 * IMPORTANT: these specs require `npm run e2e:pwa` — NOT `npm run e2e`.
 * The main playwright.config.ts excludes this directory via testIgnore.
 */

import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/db-reset';
import { seedExercises, seedRoutines } from '../fixtures/seed';

// ---------------------------------------------------------------------------
// Inline helper — waits for the service worker to be installed and activated.
// Uses navigator.serviceWorker.ready (deterministic; resolves when the SW is
// controlling the page after clients.claim()). NEVER uses networkidle.
// ---------------------------------------------------------------------------

async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready);
}

// ---------------------------------------------------------------------------
// J14.1 — App shell loads from SW cache when offline
// ---------------------------------------------------------------------------

test('J14.1 app shell carga offline desde SW cache', async ({ page, context }) => {
  // Boot the app online so the SW installs and claims the page.
  await page.goto('/');
  await page.waitForSelector('fg-root');
  await waitForServiceWorker(page);

  // One online reload guarantees the page is SW-controlled (belt-and-suspenders
  // on top of clients.claim() — see ADR-E4-3).
  await page.reload();
  await page.waitForSelector('fg-root');

  // Go offline and reload — must be served from SW cache, not Chrome's offline page.
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.locator('fg-root')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

// ---------------------------------------------------------------------------
// J14.2 — IndexedDB data persists and is readable when offline
// ---------------------------------------------------------------------------

test('J14.2 IndexedDB persiste tras reload offline', async ({ page, context }) => {
  // Boot online — cleanDb auto-fixture already navigated to '/' and deleted the DB.
  // Navigate again now that the DB is clean so Angular re-opens it (Dexie v3 schema).
  await page.goto('/');
  await page.waitForSelector('fg-root');

  // Seed an exercise first (seedRoutines does NOT require exercises but seeding
  // real exercise data ensures the /routines route renders the routine card).
  await seedExercises(page, [
    {
      id: 'ex-offline-1',
      name: 'Sentadilla Offline',
      muscleGroup: 'legs',
      trackingType: 'weight-reps',
      isCustom: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);

  await seedRoutines(page, [
    {
      id: 'rt-offline-1',
      name: 'Rutina Offline Test',
      description: '',
      isActive: true,
      schedule: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);

  // Navigate to /routines and assert the routine is visible online.
  await waitForServiceWorker(page);
  await page.goto('/routines');
  await page.waitForSelector('fg-root');
  await expect(page.getByText('Rutina Offline Test')).toBeVisible();

  // Go offline, reload, assert same routine is still visible from IDB + SW-cached chunk.
  await context.setOffline(true);
  try {
    await page.reload();
    await page.waitForSelector('fg-root');
    await expect(page.getByText('Rutina Offline Test')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

// ---------------------------------------------------------------------------
// J14.3 — Navigation works offline across all 5 lazy routes
// ---------------------------------------------------------------------------

test('J14.3 navegacion offline cross-routes', async ({ page, context }) => {
  const routes = ['/training', '/routines', '/exercises', '/progress', '/profile'];

  // Online warm-up: visit each route so chunks are guaranteed to be in SW cache
  // (belt-and-suspenders — ngsw prefetch covers all /*.js at install time, but
  // an explicit visit removes any doubt).
  await page.goto('/');
  await page.waitForSelector('fg-root');
  await waitForServiceWorker(page);

  for (const route of routes) {
    await page.goto(route);
    await page.waitForSelector('fg-root');
  }

  // Offline phase: re-navigate all routes — each must render fg-root without network.
  await context.setOffline(true);
  try {
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('fg-root')).toBeVisible();
    }
  } finally {
    await context.setOffline(false);
  }
});
