import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/db-reset';
import { seedExercises, seedRoutines, seedTrainingDays } from '../fixtures/seed';

/**
 * J19 — La sesión corre en modo foco: sin barra de navegación y con el descanso fijo abajo.
 * Derivados de los probes del verificador independiente (fix/sesion-sin-nav).
 */

const nav = (page: Page) => page.locator('fg-bottom-nav');

async function seedDay(page: Page, exercises = 3): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const now = new Date();
  const ids = Array.from({ length: exercises }, (_, i) => `ex-${i + 1}`);
  await seedExercises(
    page,
    ids.map((id, i) => ({ id, name: `Ejercicio ${i + 1}`, muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: now, updatedAt: now })),
  );
  await seedRoutines(page, [{ id: 'rt-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: now, updatedAt: now }]);
  const target = [{ type: 'weight-reps' as const, reps: 5, weightKg: 60 }];
  await seedTrainingDays(page, [
    {
      id: 'day-1',
      routineId: 'rt-1',
      name: 'Día 1',
      label: 'A',
      exercises: ids.map((exerciseId, order) => ({ exerciseId, order, targetSets: target })),
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

async function startSession(page: Page): Promise<void> {
  await page.goto('/training');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Empezar sesión de Día 1' }).click();
  await expect(page).toHaveURL(/\/training\/session$/);
}

test.describe('J19 — Sesión en modo foco', () => {
  test('J19.1 — la sesión oculta la barra; minimizar, atrás y adelante la alternan', async ({ page }) => {
    await seedDay(page);
    await startSession(page);
    await expect(nav(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Minimizar sesión' }).click();
    await expect(page).toHaveURL(/\/training$/);
    await expect(nav(page)).toHaveCount(1);

    await page.goBack();
    await expect(page).toHaveURL(/\/training\/session$/);
    await expect(nav(page)).toHaveCount(0);

    await page.goForward();
    await expect(page).toHaveURL(/\/training$/);
    await expect(nav(page)).toHaveCount(1);
  });

  test('J19.2 — recargar en la sesión no muestra la barra ni un instante', async ({ page }) => {
    await seedDay(page);
    await startSession(page);
    await page.addInitScript(() => {
      (window as unknown as { __navSeen: boolean }).__navSeen = false;
      new MutationObserver(() => {
        if (document.querySelector('fg-bottom-nav')) (window as unknown as { __navSeen: boolean }).__navSeen = true;
      }).observe(document, { childList: true, subtree: true });
    });

    await page.reload();
    await expect(page.getByRole('button', { name: 'Minimizar sesión' })).toBeVisible();
    await expect(nav(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __navSeen: boolean }).__navSeen)).toBe(false);
  });

  test('J19.3 — cancelar y terminar devuelven la barra', async ({ page }) => {
    await seedDay(page);
    await startSession(page);
    await page.getByRole('button', { name: 'Cancelar entrenamiento' }).click();
    await page.getByRole('button', { name: 'Sí, cancelar' }).click();
    await expect(page).toHaveURL(/\/training$/);
    await expect(nav(page)).toHaveCount(1);

    await startSession(page);
    await page.getByRole('button', { name: 'Loguear set' }).first().click();
    await page.getByRole('button', { name: 'Terminar sesión' }).click();
    await page.getByRole('button', { name: 'Sí, terminar' }).click();
    await expect(page).toHaveURL(/\/training\/session\/summary$/);
    await expect(nav(page)).toHaveCount(1);
  });

  test('J19.4 — con el descanso corriendo, el final de la sesión sigue a la vista y tocable', async ({ page }) => {
    await seedDay(page, 6);
    await startSession(page);
    await page.getByRole('button', { name: 'Loguear set' }).first().click();
    await expect(page.locator('fg-rest-timer [role="timer"]')).toBeVisible();

    const scroller = page.locator('.app-layout__content');
    const bottomBar = page.locator('[data-testid="session-bottom"]');
    await scroller.evaluate((e) => e.scrollTo(0, e.scrollHeight));
    const cancel = (await page.getByRole('button', { name: 'Cancelar entrenamiento' }).boundingBox())!;
    expect(cancel.y + cancel.height).toBeLessThanOrEqual((await bottomBar.boundingBox())!.y);

    await page.getByRole('button', { name: 'Cancelar entrenamiento' }).click();
    await scroller.evaluate((e) => e.scrollTo(0, e.scrollHeight));
    const confirm = (await page.getByRole('button', { name: 'Sí, cancelar' }).boundingBox())!;
    expect(confirm.y + confirm.height).toBeLessThanOrEqual((await bottomBar.boundingBox())!.y);
  });

  test('J19.5 — desde cualquier pestaña se vuelve a la sesión en curso', async ({ page }) => {
    const bar = page.getByRole('link', { name: 'Continuar entrenamiento en curso: Día 1' });
    await seedDay(page);
    await startSession(page);
    await page.getByRole('button', { name: 'Minimizar sesión' }).click();
    // Hoy has its own "Entrenamiento en curso" card.
    await expect(page).toHaveURL(/\/training$/);
    await expect(bar).toHaveCount(0);

    for (const tab of ['Rutinas', 'Ejercicios', 'Progreso', 'Perfil']) {
      await nav(page).getByRole('link', { name: tab }).click();
      await expect(bar, tab).toBeVisible();
    }
    // Above the bottom nav, not over the page content.
    const strip = (await bar.boundingBox())!;
    expect(strip.y + strip.height).toBeLessThanOrEqual((await nav(page).boundingBox())!.y + 0.5);

    await bar.click();
    await expect(page).toHaveURL(/\/training\/session$/);
    await page.getByRole('button', { name: 'Cancelar entrenamiento' }).click();
    await page.getByRole('button', { name: 'Sí, cancelar' }).click();
    await nav(page).getByRole('link', { name: 'Rutinas' }).click();
    await expect(page).toHaveURL(/\/routines$/);
    await expect(bar).toHaveCount(0);
  });

  test('J19.6 — la barra aparece al recargar una pestaña y se va al borrar el historial', async ({ page }) => {
    const bar = page.getByRole('link', { name: 'Continuar entrenamiento en curso: Día 1' });
    await seedDay(page);
    await startSession(page);
    await page.goto('/profile');
    await expect(bar).toBeVisible();

    // "Borrar historial" deletes the session in progress without leaving the page.
    await page.getByRole('button', { name: 'Borrar historial' }).click();
    await page.getByRole('button', { name: 'Borrar', exact: true }).click();
    await expect(bar).toHaveCount(0);
  });
});
