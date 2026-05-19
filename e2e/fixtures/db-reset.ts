import { test as base, expect } from '@playwright/test';

interface Fixtures {
  cleanDb: void;
}

/**
 * Extended Playwright `test` that auto-resets IndexedDB before every test.
 *
 * Import `test` and `expect` from this file instead of `@playwright/test`
 * to get automatic DB cleanup as a before-each fixture.
 *
 * The fixture navigates to `about:blank` first to establish a browser context
 * origin, then deletes the `'forge'` database using the raw IndexedDB API.
 * (Dexie is not on `window` — only the raw IDB API is available here.)
 */
export const test = base.extend<Fixtures>({
  cleanDb: [
    async ({ page: _page }, use) => {
      // Navigate to the app origin so IndexedDB is accessible.
      // about:blank does not have IDB access (SecurityError in Chromium).
      // A goto('/') boots the app briefly, but the DB delete happens immediately
      // after — no Dexie connection has time to establish and `onblocked` should not fire.
      await _page.goto('/');
      await _page.evaluate(
        () =>
          new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase('forge');
            req.onsuccess = (): void => resolve();
            req.onerror = (): void => reject(req.error);
            req.onblocked = (): void => resolve(); // best-effort: no active connection expected
          }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
