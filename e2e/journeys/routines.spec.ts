import { test, expect } from '../fixtures/db-reset';
import {
  seedExercises,
  seedRoutines,
  seedTrainingDays,
} from '../fixtures/seed';

// ─── J2 — Create routine ──────────────────────────────────────────────────────

test.describe('J2 — Create routine', () => {
  test('J2.1 — new-routine page renders with empty form', async ({ page }) => {
    await page.goto('/routines/new');
    await page.waitForLoadState('networkidle');

    // fg-page-header renders title as <div>, not a semantic heading — use text scope
    await expect(page.locator('fg-page-header').getByText('Nueva rutina', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Guardar rutina' })).toBeVisible();
  });

  test('J2.2 — valid submit → /routines → card con chip "Activa"', async ({ page }) => {
    await page.goto('/routines/new');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Nombre').fill('Pierna A');
    await page.getByRole('button', { name: 'Guardar rutina' }).click();

    await expect(page).toHaveURL(/\/routines$/);
    await expect(page.getByRole('button', { name: /Abrir rutina Pierna A/ })).toBeVisible();
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Pierna A' }).getByText('Activa', { exact: true }),
    ).toBeVisible();
  });

  test('J2.3 — nombre vacío → no navega → muestra error', async ({ page }) => {
    await page.goto('/routines/new');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Guardar rutina' }).click();

    await expect(page).toHaveURL(/\/routines\/new$/);
    await expect(page.getByText('El nombre es obligatorio')).toBeVisible();
  });
});

// ─── J3 — Add training day ────────────────────────────────────────────────────

test.describe('J3 — Add training day', () => {
  test('J3.1 — editor muestra estado vacío al abrir rutina sin días', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      {
        id: 'r-1',
        name: 'Pierna',
        isActive: true,
        schedule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await page.goto('/routines/r-1');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('fg-page-header').getByText('Editar rutina', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue('Pierna');
    await expect(page.getByText('Sin días aún')).toBeVisible();
    await expect(page.getByRole('button', { name: /Agregar día/ })).toBeVisible();
  });

  test('J3.2 — click "Agregar día" → aparece "Día 1"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      {
        id: 'r-1',
        name: 'Pierna',
        isActive: true,
        schedule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await page.goto('/routines/r-1');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Agregar día/ }).click();

    await expect(page.getByText('Día 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Sin días aún')).toBeHidden();
  });
});

// ─── J4 — Pick exercise (full UI) ─────────────────────────────────────────────

test.describe('J4 — Pick exercise (full UI)', () => {
  test('J4.1 — day editor muestra estado vacío de ejercicios', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // R-2: seed exercises BEFORE routine and training day
    await seedExercises(page, [
      { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-2', name: 'Press de banca', muscleGroup: 'chest', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-3', name: 'Peso Muerto', muscleGroup: 'back', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedTrainingDays(page, [
      { id: 'd-1', routineId: 'r-1', name: 'Día A', exercises: [], createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines/r-1/days/d-1');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('fg-page-header').getByText('Editar día', { exact: true })).toBeVisible();
    await expect(page.getByText('Sin ejercicios')).toBeVisible();
    await expect(page.getByRole('button', { name: /Agregar ejercicio/ })).toBeVisible();
  });

  test('J4.2 — "Agregar ejercicio" navega al picker con los 3 ejercicios', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedExercises(page, [
      { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-2', name: 'Press de banca', muscleGroup: 'chest', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-3', name: 'Peso Muerto', muscleGroup: 'back', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedTrainingDays(page, [
      { id: 'd-1', routineId: 'r-1', name: 'Día A', exercises: [], createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines/r-1/days/d-1');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Agregar ejercicio/ }).click();

    await expect(page).toHaveURL(/\/routines\/r-1\/days\/d-1\/pick-exercise$/);
    await expect(page.getByRole('button', { name: 'Elegir Sentadilla' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elegir Press de banca' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elegir Peso Muerto' })).toBeVisible();
  });

  test('J4.3 — elegir ejercicio → vuelve al editor → muestra nombre (no UUID)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedExercises(page, [
      { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-2', name: 'Press de banca', muscleGroup: 'chest', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ex-3', name: 'Peso Muerto', muscleGroup: 'back', trackingType: 'weight-reps', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedTrainingDays(page, [
      { id: 'd-1', routineId: 'r-1', name: 'Día A', exercises: [], createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines/r-1/days/d-1');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Agregar ejercicio/ }).click();
    await expect(page).toHaveURL(/\/pick-exercise$/);

    await page.getByRole('button', { name: 'Elegir Sentadilla' }).click();

    await expect(page).toHaveURL(/\/routines\/r-1\/days\/d-1$/);
    // Validates ADR-40: exerciseName from GetTrainingDayWithExercisesUseCase view-model, NOT UUID
    await expect(page.getByText('Sentadilla', { exact: true })).toBeVisible();
  });
});

// ─── J5 — Weekly schedule ─────────────────────────────────────────────────────

test.describe('J5 — Weekly schedule', () => {
  test('J5.1 — 7 selects se renderizan con opción de descanso por defecto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedTrainingDays(page, [
      { id: 'd-a', routineId: 'r-1', name: 'Día A', exercises: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'd-b', routineId: 'r-1', name: 'Día B', exercises: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'd-c', routineId: 'r-1', name: 'Día C', exercises: [], createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines/r-1/schedule');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('fg-page-header').getByText('Programa semanal', { exact: true })).toBeVisible();
    expect(await page.locator('select').count()).toBe(7);

    // All selects default to '' (rest day)
    for (const select of await page.locator('select').all()) {
      await expect(select).toHaveValue('');
    }
  });

  test('J5.2 — asignar días + guardar → mensaje de éxito → navega a /routines/r-1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await seedTrainingDays(page, [
      { id: 'd-a', routineId: 'r-1', name: 'Día A', exercises: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'd-b', routineId: 'r-1', name: 'Día B', exercises: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'd-c', routineId: 'r-1', name: 'Día C', exercises: [], createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines/r-1/schedule');
    await page.waitForLoadState('networkidle');

    // Assign days via direct ID selectors (label binding uses [for]="'schedule-' + dow")
    await page.locator('#schedule-monday').selectOption('d-a');
    await page.locator('#schedule-wednesday').selectOption('d-b');
    await page.locator('#schedule-friday').selectOption('d-c');

    // Assert values before saving
    await expect(page.locator('#schedule-monday')).toHaveValue('d-a');
    await expect(page.locator('#schedule-wednesday')).toHaveValue('d-b');
    await expect(page.locator('#schedule-friday')).toHaveValue('d-c');

    await page.getByRole('button', { name: 'Guardar programa' }).click();

    // Assert success message FIRST (race-free), THEN URL (setTimeout 1000ms)
    await expect(page.getByRole('status')).toHaveText('Programa guardado correctamente.');
    await expect(page).toHaveURL(/\/routines\/r-1$/, { timeout: 3000 });
  });
});

// ─── J6a — Auto-activate first routine ───────────────────────────────────────

test.describe('J6a — Auto-activate first routine', () => {
  test('J6a.1 — training-home muestra estado vacío sin rutinas', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-empty-state]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sin rutina activa' })).toBeVisible();
  });

  test('J6a.2 — segunda rutina NO se auto-activa cuando ya hay una activa', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      {
        id: 'r-1',
        name: 'Existing',
        isActive: true,
        schedule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await page.goto('/routines/new');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Nombre').fill('Second');
    await page.getByRole('button', { name: 'Guardar rutina' }).click();

    await expect(page).toHaveURL(/\/routines$/);

    // DEPENDS ON: CreateRoutineUseCase:23 — isActive: activeRoutine === null
    // First routine keeps "Activa" chip; second must NOT have it
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Existing' }).getByText('Activa', { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('fg-routine-card').filter({ hasText: 'Second' }).getByText('Activa', { exact: true }),
    ).not.toBeVisible();
  });
});
