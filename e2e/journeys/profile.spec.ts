import { test, expect } from '../fixtures/db-reset';
import { seedProfile, type SeedProfile } from '../fixtures/seed';

// ─── J13 — Perfil ─────────────────────────────────────────────────────────────

test.describe('J13 — Perfil', () => {
  test('J13.1 — la unidad de peso se guarda al instante y persiste tras recarga', async ({ page }) => {
    // Boot Angular + Dexie (navigate-first contract)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();

    const profile: SeedProfile = {
      id: 'me',
      name: 'Luca',
      preferredUnit: 'kg',
      createdAt: now,
      updatedAt: now,
    };

    await seedProfile(page, profile);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();

    const units = page.getByRole('radiogroup', { name: 'Unidad de peso' });
    await expect(units.getByRole('radio', { name: 'kg' })).toHaveAttribute('aria-checked', 'true');

    await units.getByRole('radio', { name: 'lb' }).click();
    await expect(units.getByRole('radio', { name: 'lb' })).toHaveAttribute('aria-checked', 'true');
    await page.waitForTimeout(500); // wait for async IDB save to complete

    // No toast exists — reload to verify persistence (reload-persists pattern, ADR-E3-4)
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(units.getByRole('radio', { name: 'lb' })).toHaveAttribute('aria-checked', 'true');
    await expect(units.getByRole('radio', { name: 'kg' })).toHaveAttribute('aria-checked', 'false');
  });

  test('J13.2 — el tema cambia al instante, acompaña theme-color y persiste tras recarga', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const themeColor = page.locator('meta[name="theme-color"]');
    const themes = page.getByRole('radiogroup', { name: 'Tema' });

    await expect(themes.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'true');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await themes.getByRole('radio', { name: 'Oscuro' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(themeColor).toHaveAttribute('content', '#0F0F11');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(themes.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true');
  });

  test('J13.3 — el color de acento cambia al instante y persiste tras recarga', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const accents = page.getByRole('radiogroup', { name: 'Color de acento' });

    await expect(accents.getByRole('radio', { name: 'Cobalto' })).toHaveAttribute('aria-checked', 'true');

    await accents.getByRole('radio', { name: 'Verde' }).click();
    await expect(html).toHaveAttribute('data-accent', 'green');
    await expect(accents.getByRole('radio', { name: 'Verde' })).toHaveAttribute('aria-checked', 'true');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(html).toHaveAttribute('data-accent', 'green');
    await expect(accents.getByRole('radio', { name: 'Verde' })).toHaveAttribute('aria-checked', 'true');
  });
});
