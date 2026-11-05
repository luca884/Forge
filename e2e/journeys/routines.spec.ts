import { test, expect } from '../fixtures/db-reset';
import {
  seedExercises,
  seedRoutines,
  seedTrainingDays,
  waitForStoredDayOrder,
} from '../fixtures/seed';

// ─── J2 — Create routine ──────────────────────────────────────────────────────

test.describe('J2 — Create routine', () => {
  test('J2.1 — new-routine page renders with empty form', async ({ page }) => {
    await page.goto('/routines/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Nueva rutina' })).toBeVisible();
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

    await expect(page.getByRole('heading', { name: 'Editar rutina' })).toBeVisible();
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

    await expect(page.getByRole('heading', { name: 'Editar día' })).toBeVisible();
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
    await expect(page.getByRole('button', { name: 'Seleccionar Sentadilla' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seleccionar Press de banca' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seleccionar Peso Muerto' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Seleccionar Sentadilla' }).click();
    await page.getByRole('button', { name: 'Agregar 1 ejercicio' }).click();

    await expect(page).toHaveURL(/\/routines\/r-1\/days\/d-1$/);
    // Validates ADR-40: exerciseName from GetTrainingDayWithExercisesUseCase view-model, NOT UUID
    await expect(page.getByText('Sentadilla', { exact: true })).toBeVisible();
  });

  test('J4.4 — selección múltiple: contador, agrega los elegidos y el picker marca "En el día"', async ({ page }) => {
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

    await page.goto('/routines/r-1/days/d-1/pick-exercise');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Agregar a Día A' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elegí ejercicios' })).toBeDisabled();

    await page.getByRole('button', { name: 'Seleccionar Sentadilla' }).click();
    await page.getByRole('button', { name: 'Seleccionar Press de banca' }).click();
    await page.getByRole('button', { name: 'Agregar 2 ejercicios' }).click();

    await expect(page).toHaveURL(/\/routines\/r-1\/days\/d-1$/);
    await expect(page.getByText('Sentadilla', { exact: true })).toBeVisible();
    await expect(page.getByText('Press de banca', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Agregar ejercicio/ }).click();
    await expect(page).toHaveURL(/\/pick-exercise$/);
    await expect(page.getByRole('button', { name: 'Sentadilla, en el día' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Press de banca, en el día' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Seleccionar Peso Muerto' })).toBeEnabled();
  });

  test('J4.5 — los rangos de tiempo y distancia entran en Objetivo en una línea y alineados', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const now = new Date();
    await seedExercises(page, [
      { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: now, updatedAt: now },
      { id: 'ex-2', name: 'Plancha', muscleGroup: 'core', trackingType: 'time', isCustom: false, createdAt: now, updatedAt: now },
      { id: 'ex-3', name: 'Remo ergómetro', muscleGroup: 'cardio', trackingType: 'distance-time', isCustom: false, createdAt: now, updatedAt: now },
    ]);
    await seedRoutines(page, [
      { id: 'r-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: now, updatedAt: now },
    ]);
    await seedTrainingDays(page, [
      {
        id: 'd-1',
        routineId: 'r-1',
        name: 'Día A',
        exercises: [
          { exerciseId: 'ex-1', order: 0, targetSets: [{ type: 'weight-reps', reps: 8 }, { type: 'weight-reps', reps: 8 }] },
          {
            exerciseId: 'ex-2',
            order: 1,
            targetSets: [
              { type: 'time', durationSec: 120 },
              { type: 'time', durationSec: 150 },
              { type: 'time', durationSec: 180 },
            ],
          },
          {
            exerciseId: 'ex-3',
            order: 2,
            targetSets: [
              { type: 'distance-time', distanceKm: 5, durationSec: 1500 },
              { type: 'distance-time', distanceKm: 10, durationSec: 3000 },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await page.goto('/routines/r-1/days/d-1');
    await expect(page.getByRole('heading', { name: 'Editar día' })).toBeVisible();
    const rows = page.locator('[data-exercise-row]');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(1)).toContainText('3 × 120–180 s');
    await expect(rows.nth(2)).toContainText('2 × 5–10 km');

    const layout = await page.evaluate(() => {
      const header = Array.from(document.querySelectorAll('span')).find((s) => s.textContent === 'Objetivo')!;
      const cells = Array.from(document.querySelectorAll('[data-exercise-row] button[aria-expanded] > [data-cell]:nth-child(3)'));
      // Right edge of the row number's text and left edge of the exercise name, per row.
      const numberGaps = Array.from(document.querySelectorAll('[data-exercise-row] button[aria-expanded]')).map((button) => {
        const [number, name] = Array.from(button.querySelectorAll(':scope > [data-cell]'));
        const range = document.createRange();
        range.selectNodeContents(number!);
        return Math.round(name!.getBoundingClientRect().left - range.getBoundingClientRect().right);
      });
      return {
        numberGaps,
        headerLeft: Math.round(header.getBoundingClientRect().left),
        cells: cells.map((cell) => {
          const range = document.createRange();
          range.selectNodeContents(cell);
          return {
            text: cell.textContent?.trim(),
            lines: range.getClientRects().length,
            left: Math.round(cell.getBoundingClientRect().left),
          };
        }),
      };
    });
    for (const cell of layout.cells) {
      expect(cell, `"${cell.text}" en una línea`).toMatchObject({ lines: 1 });
      expect(cell.left, `"${cell.text}" alineado con Objetivo`).toBe(layout.headerLeft);
    }
    // El número de fila no pisa el nombre: queda al menos el espacio entre columnas.
    for (const gap of layout.numberGaps) expect(gap).toBeGreaterThanOrEqual(6);
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

    await expect(page.getByRole('heading', { name: 'Programa semanal' })).toBeVisible();
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
  // S8: with no routines at all Hoy shows Primer uso (J1); "Sin rutina activa" is for routines with none active.
  test('J6a.1 — training-home muestra estado vacío con rutinas pero ninguna activa', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      { id: 'r-1', name: 'Inactiva', isActive: false, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

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

  test('J6a.3 — "Activar" en la lista pasa la activa a la otra rutina (solo una activa)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      { id: 'r-1', name: 'Existing', isActive: true, schedule: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-2', name: 'Second', isActive: false, schedule: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    await page.goto('/routines');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Activar rutina Second' }).click();

    const second = page.locator('fg-routine-card').filter({ hasText: 'Second' });
    const existing = page.locator('fg-routine-card').filter({ hasText: 'Existing' });
    await expect(second.getByText('Activa', { exact: true })).toBeVisible();
    await expect(existing.getByText('Activa', { exact: true })).toHaveCount(0);
    await expect(existing.getByRole('button', { name: 'Activar rutina Existing' })).toBeVisible();
  });
});

// ─── J17 — Reordenar ejercicios del día (S3) ─────────────────────────────────

test.describe('J17 — Reordenar ejercicios en el editor de día', () => {
  test('J17.1 — arrastrar la manija ≡ cambia el orden y queda guardado al recargar', async ({ page }) => {
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
      {
        id: 'd-1',
        routineId: 'r-1',
        name: 'Día A',
        exercises: [
          { exerciseId: 'ex-1', order: 0, targetSets: [] },
          { exerciseId: 'ex-2', order: 1, targetSets: [] },
          { exerciseId: 'ex-3', order: 2, targetSets: [] },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await page.goto('/routines/r-1/days/d-1');
    await page.waitForLoadState('networkidle');
    const order = (): Promise<string[]> =>
      page
        .getByRole('button', { name: /^Mover / })
        .evaluateAll((handles) => handles.map((h) => (h.getAttribute('aria-label') ?? '').replace('Mover ', '')));
    await expect.poll(order).toEqual(['Sentadilla', 'Press de banca', 'Peso Muerto']);

    await dragHandle(page, 'Mover Sentadilla', 'Mover Peso Muerto');

    await expect.poll(order).toEqual(['Press de banca', 'Peso Muerto', 'Sentadilla']);
    await waitForStoredDayOrder(page, 'd-1', ['ex-2', 'ex-3', 'ex-1']);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect.poll(order).toEqual(['Press de banca', 'Peso Muerto', 'Sentadilla']);
  });

  test('J17.2 — con un ejercicio abierto las manijas no arrastran; al cerrarlo, el ejercicio cae donde se suelta', async ({ page }) => {
    // Verifier blocker (L7): closing the open row at drag start dropped the exercise in the wrong place.
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
    const target = [{ type: 'weight-reps' as const, reps: 8 }];
    await seedTrainingDays(page, [
      {
        id: 'd-1',
        routineId: 'r-1',
        name: 'Día A',
        exercises: [
          { exerciseId: 'ex-1', order: 0, targetSets: [...target, ...target, ...target] },
          { exerciseId: 'ex-2', order: 1, targetSets: target },
          { exerciseId: 'ex-3', order: 2, targetSets: target },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    await page.goto('/routines/r-1/days/d-1');
    await page.waitForLoadState('networkidle');
    const handles = page.getByRole('button', { name: /^Mover / });

    await page.getByRole('button', { name: 'Editar series de Sentadilla' }).click();
    await expect(handles).toHaveCount(3);
    for (const handle of await handles.all()) await expect(handle).toBeDisabled();

    await page.getByRole('button', { name: 'Editar series de Sentadilla' }).click();
    for (const handle of await handles.all()) await expect(handle).toBeEnabled();
    await dragHandle(page, 'Mover Peso Muerto', 'Mover Press de banca');

    await waitForStoredDayOrder(page, 'd-1', ['ex-1', 'ex-3', 'ex-2']);
    await expect
      .poll(() => handles.evaluateAll((hs) => hs.map((h) => h.getAttribute('aria-label'))))
      .toEqual(['Mover Sentadilla', 'Mover Peso Muerto', 'Mover Press de banca']);
  });
});

/** Drags a ≡ handle with small pointer steps (CDK needs real movement) and drops it just past the target row's handle. */
async function dragHandle(page: import('@playwright/test').Page, from: string, to: string): Promise<void> {
  const a = await page.getByRole('button', { name: from }).boundingBox();
  const b = await page.getByRole('button', { name: to }).boundingBox();
  if (!a || !b) throw new Error('handle not visible');
  const x = a.x + a.width / 2;
  await page.mouse.move(x, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, a.y + a.height / 2 + 10, { steps: 5 });
  await page.mouse.move(x, b.y + b.height / 2 + 8, { steps: 20 });
  await page.mouse.up();
}
