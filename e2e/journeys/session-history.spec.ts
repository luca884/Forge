import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { FIXED_NOW, seedVisualData } from '../visual/visual-data';

/**
 * J23 — Sesiones pasadas: abrir una sesión del Diario y corregir o borrar sus series; los récords
 * siguen a la corrección. Spec: odd/tasks/sesiones-pasadas.md (S1, S2).
 */

async function openLatestSession(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await seedVisualData(page);
  await page.goto('/training');
  await page.waitForLoadState('networkidle');
  await page.locator('a[data-journal-row]').first().click();
  await expect(page).toHaveURL(/\/training\/history\/[^/]+$/);
  await expect(page.getByText('Tocá una serie para corregirla o borrarla.')).toBeVisible();
}

/** The records list, as text. */
async function recordsText(page: Page): Promise<string> {
  await page.goto('/progress/prs');
  await page.waitForLoadState('networkidle');
  return (await page.locator('main').textContent()) ?? '';
}

test.describe('J23 — Sesiones pasadas', () => {
  test('J23.1 — corregir el peso de una serie vieja lo guarda y lo vuelve récord; borrarla lo saca', async ({ page }) => {
    await openLatestSession(page);
    const detail = page.url();
    const firstCard = page.locator('fg-exercise-session-card').first();
    const exercise = (await firstCard.locator('h2').textContent())!.trim();
    expect(await recordsText(page)).not.toContain('300 kg');

    // Correct: 300 kg is above anything logged, so it becomes the exercise's record.
    await page.goto(detail);
    await page.locator('fg-exercise-session-card').first().getByRole('button', { name: 'Editar set' }).first().click();
    await page.getByLabel('Peso en kg').fill('300');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Serie corregida')).toBeVisible();
    await expect(page.locator('fg-exercise-session-card').first()).toContainText('300 kg');

    // Survives a reload: it is stored, not only shown.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('fg-exercise-session-card').first()).toContainText('300 kg');
    const records = await recordsText(page);
    expect(records).toContain(exercise);
    expect(records).toContain('300 kg');

    // Remove it: the record goes with it.
    await page.goto(detail);
    await page.locator('fg-exercise-session-card').first().getByRole('button', { name: 'Editar set' }).first().click();
    await page.getByRole('button', { name: 'Borrar set' }).click();
    await expect(page.getByText('Serie borrada')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('300 kg');
    expect(await recordsText(page)).not.toContain('300 kg');
  });

  test('J23.2 — la sesión no ofrece cargar series nuevas, solo corregir las que hay', async ({ page }) => {
    await openLatestSession(page);
    await expect(page.getByRole('button', { name: 'Loguear set' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar set' }).first()).toBeVisible();
  });
});
