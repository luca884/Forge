import { test, expect } from '../fixtures/db-reset';
import {
  daysAgo,
  seedExercises,
  seedRoutines,
  seedSessions,
  seedTrainingDays,
  seedWorkedSets,
  type SeedExercise,
  type SeedRoutine,
  type SeedTrainingDay,
} from '../fixtures/seed';

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

// ─── J7 — Start session + log one set smoke ───────────────────────────────────

test.describe('J7 — Start session + log one set', () => {
  test('hero renders, day click navega a sesion, loguear set incrementa contador', async ({
    page,
  }) => {
    // STEP 1: Boot Angular + Dexie (db-reset fixture already ran goto('/') but
    // we need to ensure the schema is created before seeding).
    // The db-reset fixture has already navigated to '/', so Dexie opened the DB.
    // We navigate again to ensure the app is fully initialized.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // STEP 2: Seed via raw IDB into the app-created schema.
    const now = new Date();

    const exercise: SeedExercise = {
      id: 'ex-1',
      name: 'Sentadilla',
      muscleGroup: 'legs',
      trackingType: 'weight-reps',
      isCustom: false,
      createdAt: now,
      updatedAt: now,
    };

    const routine: SeedRoutine = {
      id: 'rt-1',
      name: 'Rutina test',
      isActive: true,
      schedule: null, // No schedule → data-routine-card + data-days-list still render
      createdAt: now,
      updatedAt: now,
    };

    const day: SeedTrainingDay = {
      id: 'day-1',
      routineId: 'rt-1',
      name: 'Día 1',
      label: 'A',
      exercises: [
        {
          exerciseId: 'ex-1',
          order: 0,
          targetSets: [{ type: 'weight-reps', reps: 5, weightKg: 60 }],
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await seedExercises(page, [exercise]);
    await seedRoutines(page, [routine]);
    await seedTrainingDays(page, [day]);

    // STEP 3: Navigate to /training so the page re-reads seeded data.
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // STEP 4: Assert active-routine card renders (data-routine-card:154, h3:157).
    await expect(page.locator('[data-routine-card]')).toContainText('Rutina test');
    await expect(page.locator('[data-days-list]')).toBeVisible();

    // STEP 5: Click the day button — text is "Día 1 · A" (training-home.page.ts:177).
    const dayButton = page
      .locator('[data-days-list]')
      .getByRole('button', { name: 'Empezar sesión de Día 1' });
    await expect(dayButton).toBeVisible();
    await dayButton.click();

    // STEP 6: Confirm navigation to session page.
    await expect(page).toHaveURL(/\/training\/session$/);
    await page.waitForLoadState('networkidle');

    // STEP 7: Exercise card is expanded by default (expanded input defaults to true).
    // Assert session counter starts at "0 de 1 sets" (training-session.page.ts:64).
    await expect(page.getByText(/0 de 1 sets/)).toBeVisible();

    // STEP 8: The logger pre-fills the routine target (60 kg × 5 reps).
    // Click "Loguear set".
    const logBtn = page.getByRole('button', { name: 'Loguear set' });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // STEP 9: Counter increments to "1 de 1 sets".
    await expect(page.getByText(/1 de 1 sets/)).toBeVisible();
  });
});

// ─── J8 — Finalizar sesión y summary ─────────────────────────────────────────

test.describe('J8 — Finalizar sesión y summary', () => {
  test('J8 — finalizar sesion completa → URL summary → secciones visibles', async ({ page }) => {
    // Replays J7 setup inline (same seed, same navigation steps)

    // STEP 1: Boot Angular + Dexie
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();

    const exercise: SeedExercise = {
      id: 'ex-1',
      name: 'Sentadilla',
      muscleGroup: 'legs',
      trackingType: 'weight-reps',
      isCustom: false,
      createdAt: now,
      updatedAt: now,
    };

    const routine: SeedRoutine = {
      id: 'rt-1',
      name: 'Rutina test',
      isActive: true,
      schedule: null,
      createdAt: now,
      updatedAt: now,
    };

    const day: SeedTrainingDay = {
      id: 'day-1',
      routineId: 'rt-1',
      name: 'Día 1',
      label: 'A',
      exercises: [
        {
          exerciseId: 'ex-1',
          order: 0,
          targetSets: [{ type: 'weight-reps', reps: 5, weightKg: 60 }],
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await seedExercises(page, [exercise]);
    await seedRoutines(page, [routine]);
    await seedTrainingDays(page, [day]);

    // STEP 2: Navigate to /training
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // STEP 3: Click the day button
    const dayButton = page
      .locator('[data-days-list]')
      .getByRole('button', { name: 'Empezar sesión de Día 1' });
    await expect(dayButton).toBeVisible();
    await dayButton.click();

    // STEP 4: Wait for session page
    await expect(page).toHaveURL(/\/training\/session$/);
    await page.waitForLoadState('networkidle');

    // STEP 5: The logger pre-fills the routine target (60 kg × 5 reps).
    // Log the set.
    const logBtn = page.getByRole('button', { name: 'Loguear set' });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // STEP 7: Confirm 1 de 1 sets logged
    await expect(page.getByText(/1 de 1 sets/)).toBeVisible();

    // STEP 8: Click "Terminar sesión" — text button (not aria-label)
    await page.getByRole('button', { name: 'Terminar sesión' }).click();

    // STEP 9: URL navigates to summary
    await expect(page).toHaveURL(/\/training\/session\/summary$/, { timeout: 5000 });

    // STEP 10: Summary sections visible
    await expect(page.getByText('Sesión completada')).toBeVisible();
    await expect(page.getByText('VOLUMEN TOTAL')).toBeVisible();
    await expect(page.getByText('Sets', { exact: true })).toBeVisible();
    await expect(page.getByText('Reps totales')).toBeVisible();
    await expect(page.getByText('Duración', { exact: true })).toBeVisible();
    await expect(page.getByText('Descanso prom.')).toBeVisible();
    await expect(page.getByText('EJERCICIOS', { exact: true })).toBeVisible();
    // Bug #585 fix: exercise name must appear, not raw UUID
    await expect(page.getByText('Sentadilla').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar y cerrar' })).toBeVisible();
  });
});

// ─── J13 — Prefill con lo hecho la última vez ─────────────────────────────────

test.describe('J14 — Prefill con lo de la última vez', () => {
  test('los inputs arrancan con los valores del mismo slot de la sesión anterior', async ({
    page,
  }) => {
    // STEP 1: Boot Angular + Dexie
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();
    const lastWeek = daysAgo(7);

    const exercise: SeedExercise = {
      id: 'ex-1',
      name: 'Press banca',
      muscleGroup: 'chest',
      trackingType: 'weight-reps',
      isCustom: false,
      createdAt: lastWeek,
      updatedAt: lastWeek,
    };

    const routine: SeedRoutine = {
      id: 'rt-1',
      name: 'Rutina test',
      isActive: true,
      schedule: null,
      createdAt: lastWeek,
      updatedAt: lastWeek,
    };

    // Dos sets planificados: el plan dice 60 kg × 5, pero la semana pasada se
    // hicieron 20 kg × 8 y 20 kg × 7 — esos son los valores que deben aparecer.
    const day: SeedTrainingDay = {
      id: 'day-1',
      routineId: 'rt-1',
      name: 'Día 1',
      label: 'A',
      exercises: [
        {
          exerciseId: 'ex-1',
          order: 0,
          targetSets: [
            { type: 'weight-reps', reps: 5, weightKg: 60 },
            { type: 'weight-reps', reps: 5, weightKg: 60 },
          ],
        },
      ],
      createdAt: lastWeek,
      updatedAt: lastWeek,
    };

    await seedExercises(page, [exercise]);
    await seedRoutines(page, [routine]);
    await seedTrainingDays(page, [day]);

    // STEP 2: Sesión de la semana pasada, ya completada, con sus dos sets.
    await seedSessions(page, [
      {
        id: 'sess-prev',
        routineId: 'rt-1',
        dayId: 'day-1',
        date: lastWeek.toLocaleDateString('en-CA'),
        startedAt: lastWeek,
        endedAt: lastWeek,
        status: 'completed',
        createdAt: lastWeek,
        updatedAt: lastWeek,
      },
    ]);

    await seedWorkedSets(page, [
      {
        id: 'ws-prev-0',
        sessionId: 'sess-prev',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        targetSetIndex: 0,
        reps: 8,
        weightKg: 20,
        isPR: false,
        createdAt: lastWeek,
      },
      {
        id: 'ws-prev-1',
        sessionId: 'sess-prev',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        targetSetIndex: 1,
        reps: 7,
        weightKg: 20,
        isPR: false,
        createdAt: new Date(lastWeek.getTime() + 300_000),
      },
    ]);

    // STEP 3: Empezar la sesión de hoy.
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    const dayButton = page
      .locator('[data-days-list]')
      .getByRole('button', { name: 'Empezar sesión de Día 1' });
    await expect(dayButton).toBeVisible();
    await dayButton.click();

    await expect(page).toHaveURL(/\/training\/session$/);
    await page.waitForLoadState('networkidle');

    // STEP 4: El objetivo de doble progresión ya no se muestra.
    await expect(page.getByText(/superá/)).toHaveCount(0);

    // STEP 5: Set 1 arranca con lo de la última vez (20 kg × 8), no con el plan (60 × 5).
    const weightInput = page.getByLabel('Peso en kg');
    await expect(weightInput).toHaveValue('20');
    await expect(page.getByRole('option', { name: '8', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // STEP 6: Al loguear, el slot 2 arranca con lo de la última vez en ese slot (20 kg × 7).
    await page.getByRole('button', { name: 'Loguear set' }).click();
    await expect(page.getByText(/1 de 2 sets/)).toBeVisible();

    await expect(weightInput).toHaveValue('20');
    await expect(page.getByRole('option', { name: '7', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
