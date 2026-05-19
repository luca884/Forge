import { test, expect } from '../fixtures/db-reset';

// ─── J1 — Empty state smoke ───────────────────────────────────────────────────

test.describe('J1 — Empty state', () => {
  test('muestra "Sin rutina activa" y el CTA navega a /routines', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // Empty state section renders when no active routine exists
    await expect(page.locator('[data-empty-state]')).toBeVisible();

    // Heading text — h3 at training-home.page.ts:192
    await expect(page.getByRole('heading', { name: 'Sin rutina activa' })).toBeVisible();

    // CTA link — routerLink="/routines" at training-home.page.ts:194
    const cta = page.getByRole('link', { name: 'Configurar rutinas' });
    await expect(cta).toBeVisible();
    await cta.click();

    // Angular Router resolves lazy /routines chunk
    await expect(page).toHaveURL(/\/routines$/);
  });
});
