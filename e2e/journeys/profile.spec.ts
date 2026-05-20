import { test, expect } from '../fixtures/db-reset';
import { seedProfile, type SeedProfile } from '../fixtures/seed';

// ─── J13 — Editar perfil ──────────────────────────────────────────────────────

test.describe('J13 — Editar perfil', () => {
  test('J13.1 — perfil pre-seeded renderiza + editar + persiste tras recarga', async ({ page }) => {
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

    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Page title (raw <h1>Perfil</h1>)
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();

    // Pre-seeded value renders in name input (edit branch: profile() !== null)
    // Note: use locator('#name') instead of getByLabel('Nombre') to avoid ambiguity
    // — both @if branches have <label for="name">Nombre</label> and Playwright
    //   may match the wrong input during Angular's @if transition.
    await expect(page.locator('#name')).toHaveValue('Luca');

    // Edit the name — triple-click to select all, then type
    await page.locator('#name').click({ clickCount: 3 });
    await page.locator('#name').pressSequentially('Luca M', { delay: 20 });
    await expect(page.locator('#name')).toHaveValue('Luca M');

    // Submit edit
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.waitForTimeout(500); // wait for async IDB save to complete

    // No toast exists — reload to verify persistence (reload-persists pattern, ADR-E3-4)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert persisted value — use #name locator to avoid @if branch ambiguity
    await expect(page.locator('#name')).toHaveValue('Luca M');
  });
});
