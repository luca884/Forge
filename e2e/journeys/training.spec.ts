import { test, expect } from '../fixtures/db-reset';
import {
  daysAgo,
  seedExercises,
  seedProfile,
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
  test('con rutinas pero ninguna activa muestra "Sin rutina activa" y el CTA navega a /routines', async ({
    page,
  }) => {
    // S8: only an empty database shows Primer uso. One stored routine, not active, keeps this state.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await seedRoutines(page, [
      {
        id: 'rt-inactive',
        name: 'Rutina guardada',
        isActive: false,
        schedule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // Empty state section renders when no active routine exists
    await expect(page.locator('[data-empty-state]')).toBeVisible();

    // Heading text of the empty state
    await expect(page.getByRole('heading', { name: 'Sin rutina activa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Empezá en 3 pasos' })).toHaveCount(0);

    // CTA link — routerLink="/routines"
    const cta = page.getByRole('link', { name: 'Configurar rutinas' });
    await expect(cta).toBeVisible();
    await cta.click();

    // Angular Router resolves lazy /routines chunk
    await expect(page).toHaveURL(/\/routines$/);
  });

  test('sin ninguna rutina muestra Primer uso en lugar de "Sin rutina activa"', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Empezá en 3 pasos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plantillas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sin rutina activa' })).toHaveCount(0);
    await expect(page.locator('[data-empty-state]')).toHaveCount(0);
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
    // Assert session counter starts at "0 de 1 series" (training-session.page.ts:64).
    await expect(page.getByText(/0 de 1 series/)).toBeVisible();

    // STEP 8: The logger pre-fills the routine target (60 kg × 5 reps).
    // Click "Loguear set".
    const logBtn = page.getByRole('button', { name: 'Loguear set' });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // STEP 9: Counter increments to "1 de 1 series".
    await expect(page.getByText(/1 de 1 series/)).toBeVisible();
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

    // STEP 7: Confirm 1 de 1 series logged
    await expect(page.getByText(/1 de 1 series/)).toBeVisible();

    // STEP 8: Click "Terminar sesión" — text button (not aria-label)
    await page.getByRole('button', { name: 'Terminar sesión' }).click();

    // STEP 9: URL navigates to summary
    await expect(page).toHaveURL(/\/training\/session\/summary$/, { timeout: 5000 });

    // STEP 10: Summary sections visible (canvas C · Resumen)
    await expect(page.getByText('Sesión terminada')).toBeVisible();
    const totals = page.getByRole('region', { name: 'Totales' });
    await expect(totals.getByText('Duración', { exact: true })).toBeVisible();
    await expect(totals.getByText('Volumen', { exact: true })).toBeVisible();
    await expect(totals.getByText('Series', { exact: true })).toBeVisible();
    await expect(totals.getByText('Reps', { exact: true })).toBeVisible();
    // T17 · A2: el volumen (60 kg × 5 reps) sale en la unidad preferida, sin separador de miles.
    await expect(totals.locator('[data-total-value]').nth(1)).toHaveText('300');
    await expect(totals.locator('[data-total-unit]')).toHaveText('kg');
    await expect(page.getByText('Ejercicio por ejercicio')).toBeVisible();
    // T17 · A5: debajo del nombre del ejercicio va el total de sus reps (1 serie de 5).
    await expect(page.locator('[data-exercise-row]').first()).toContainText('5 reps');
    // Bug #585 fix: exercise name must appear, not raw UUID
    await expect(page.getByText('Sentadilla').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar sesión' })).toBeVisible();
  });

  test('J8.2 — los totales entran en su celda con volumen grande en lb y más de una hora', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();
    const startedAt = new Date(now.getTime() - (65 * 60 + 23) * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    await seedProfile(page, { id: 'me', name: '', preferredUnit: 'lb', createdAt: now, updatedAt: now });
    await seedExercises(page, [
      {
        id: 'ex-1',
        name: 'Sentadilla',
        muscleGroup: 'legs',
        trackingType: 'weight-reps',
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await seedRoutines(page, [
      { id: 'rt-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: now, updatedAt: now },
    ]);
    await seedTrainingDays(page, [
      {
        id: 'day-1',
        routineId: 'rt-1',
        name: 'Día 1',
        exercises: [
          {
            exerciseId: 'ex-1',
            order: 0,
            targetSets: Array.from({ length: 10 }, () => ({
              type: 'weight-reps' as const,
              reps: 10,
              weightKg: 200,
            })),
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await seedSessions(page, [
      {
        id: 'ses-1',
        routineId: 'rt-1',
        dayId: 'day-1',
        date: today,
        startedAt,
        status: 'in-progress',
        createdAt: startedAt,
        updatedAt: startedAt,
      },
    ]);
    // 10 × 200 kg × 10 reps = 20000 kg = 44092.4 lb: siete caracteres más la unidad.
    await seedWorkedSets(
      page,
      Array.from({ length: 10 }, (_, i) => ({
        id: `ws-${i}`,
        sessionId: 'ses-1',
        exerciseId: 'ex-1',
        type: 'weight-reps' as const,
        targetSetIndex: i,
        reps: 10,
        weightKg: 200,
        isPR: false,
        createdAt: startedAt,
      })),
    );

    await page.goto('/training/session');
    await expect(page.getByText(/10 de 10 series/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminar sesión' }).click();
    await expect(page).toHaveURL(/\/training\/session\/summary$/);

    const totals = page.getByRole('region', { name: 'Totales' });
    await expect(totals.locator('[data-total-value]').nth(1)).toHaveText('44092.4');
    await expect(totals.locator('[data-total-unit]')).toHaveText('lb');

    // Ninguna celda se desborda ni pisa a la de al lado.
    const overflowing = await totals.evaluate((section) =>
      Array.from(section.children)
        .filter((cell) => cell.scrollWidth > cell.clientWidth)
        .map((cell) => cell.textContent?.trim()),
    );
    expect(overflowing).toEqual([]);
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
    await expect(page.getByText(/1 de 2 series/)).toBeVisible();

    await expect(weightInput).toHaveValue('20');
    await expect(page.getByRole('option', { name: '7', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

// ─── J15 — Ejercicio en placas (D4, S11) ──────────────────────────────────────

test.describe('J15 — Ejercicio en placas', () => {
  test('las series se ven en placas y el volumen usa el peso por placa del ejercicio', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();
    const startedAt = new Date(now.getTime() - 30 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    await seedProfile(page, { id: 'me', name: '', preferredUnit: 'lb', createdAt: now, updatedAt: now });
    await seedExercises(page, [
      {
        id: 'ex-prensa',
        name: 'Prensa máquina',
        muscleGroup: 'legs',
        trackingType: 'weight-reps',
        weightUnit: 'plates',
        plateWeightKg: 10,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await seedRoutines(page, [
      { id: 'rt-1', name: 'Rutina test', isActive: true, schedule: null, createdAt: now, updatedAt: now },
    ]);
    await seedTrainingDays(page, [
      {
        id: 'day-1',
        routineId: 'rt-1',
        name: 'Día 1',
        exercises: [
          {
            exerciseId: 'ex-prensa',
            order: 0,
            targetSets: [0, 1, 2].map(() => ({ type: 'weight-reps' as const, reps: 10, weightKg: 7 })),
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await seedSessions(page, [
      {
        id: 'ses-1',
        routineId: 'rt-1',
        dayId: 'day-1',
        date: today,
        startedAt,
        status: 'in-progress',
        createdAt: startedAt,
        updatedAt: startedAt,
      },
    ]);
    // 3 series de 7 placas × 10 reps, a 10 kg por placa: 2100 kg = 4629.7 lb.
    await seedWorkedSets(
      page,
      [0, 1, 2].map((i) => ({
        id: `ws-${i}`,
        sessionId: 'ses-1',
        exerciseId: 'ex-prensa',
        type: 'weight-reps' as const,
        targetSetIndex: i,
        reps: 10,
        weightKg: 7,
        isPR: false,
        createdAt: startedAt,
      })),
    );

    await page.goto('/training/session');
    await expect(page.getByText(/3 de 3 series/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminar sesión' }).click();
    await expect(page).toHaveURL(/\/training\/session\/summary$/);

    const totals = page.getByRole('region', { name: 'Totales' });
    await expect(totals.locator('[data-total-value]').nth(1)).toHaveText('4629.7');
    await expect(totals.locator('[data-total-unit]')).toHaveText('lb');
    // La serie sigue en placas: nunca "kg" ni convertida a lb.
    const row = page.locator('[data-exercise-row]').first();
    await expect(row).toContainText('7 placas');
    await expect(row).not.toContainText(/\d\s*(kg|lb)/);

    // El formulario muestra el peso por placa guardado.
    await page.goto('/exercises/ex-prensa/edit');
    await expect(page.getByLabel('Peso por placa (opcional)')).toHaveValue('10');
  });
});
