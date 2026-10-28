import { test, expect } from '../fixtures/db-reset';
import { seedRoutines } from '../fixtures/seed';

// ─── J16 — Primer uso: plantillas de rutina (S3, S8) ──────────────────────────

test.describe('J16 — Primer uso', () => {
  test('J16.1 — "Usar" en "Full body" desde una base vacía deja la rutina activa en Hoy, con sus días A, B y C', async ({
    page,
  }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // Primer uso: the steps, with the preferred unit as the first one.
    await expect(page.getByRole('heading', { name: 'Empezá en 3 pasos' })).toBeVisible();
    await expect(page.getByText('kg · listo')).toBeVisible();

    // A marker on the document: if the app reloaded, it would be gone.
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>)['__sameDocument'] = true;
    });

    await page.getByRole('button', { name: 'Usar plantilla Full body' }).click();

    // Hoy now shows the new routine as the active one, in the same document.
    await expect(page.locator('[data-routine-card]')).toContainText('Full body');
    await expect(page).toHaveURL(/\/training$/);
    await expect(page.getByRole('heading', { name: 'Empezá en 3 pasos' })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>)['__sameDocument'])).toBe(true);

    // The template creates the days only: no week assigned yet (step 3).
    await expect(page.getByRole('heading', { name: 'Configurá tu semana' })).toBeVisible();
    const days = page.locator('[data-days-list]');
    for (const day of ['A', 'B', 'C']) {
      await expect(days.getByRole('button', { name: `Empezar sesión de ${day}`, exact: true })).toBeVisible();
    }
    await expect(days.getByText('4 ejercicios')).toHaveCount(3);

    // In Rutinas it is the active one, and day A carries its exercises with their targets.
    await page.goto('/routines');
    await expect(page.getByRole('button', { name: /Abrir rutina Full body/ })).toBeVisible();
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Full body' }).getByText('Activa', { exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Editar día A', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Editar día' })).toBeVisible();
    const rows = page.locator('[data-exercise-row]');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText('Sentadilla');
    await expect(rows.nth(0)).toContainText('3 × 8');
    await expect(rows.nth(3)).toContainText('Plancha');
    await expect(rows.nth(3)).toContainText('3 × 45 s');
  });

  test('J16.2 — con dos rutinas guardadas no aparece Primer uso y /routines las sigue listando', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const now = new Date();
    await seedRoutines(page, [
      { id: 'rt-1', name: 'Fuerza', isActive: true, schedule: null, createdAt: now, updatedAt: now },
      { id: 'rt-2', name: 'Volumen', isActive: false, schedule: null, createdAt: now, updatedAt: now },
    ]);

    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-routine-card]')).toContainText('Fuerza');
    await expect(page.getByRole('heading', { name: 'Empezá en 3 pasos' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Plantillas' })).toHaveCount(0);

    // Visiting Hoy changed nothing: both routines are still there, and the active one is still active.
    await page.goto('/routines');
    await expect(page.getByRole('button', { name: /Abrir rutina Fuerza/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Abrir rutina Volumen/ })).toBeVisible();
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Fuerza' }).getByText('Activa', { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Volumen' }).getByText('Activa', { exact: true }),
    ).toHaveCount(0);
  });
});
