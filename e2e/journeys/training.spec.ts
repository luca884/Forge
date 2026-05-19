import { test, expect } from '../fixtures/db-reset';
import {
  seedExercises,
  seedRoutines,
  seedTrainingDays,
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
      .getByRole('button', { name: /Día 1.*A/ });
    await expect(dayButton).toBeVisible();
    await dayButton.click();

    // STEP 6: Confirm navigation to session page.
    await expect(page).toHaveURL(/\/training\/session$/);
    await page.waitForLoadState('networkidle');

    // STEP 7: Exercise card is expanded by default (expanded input defaults to true).
    // Assert session counter starts at "0 de 1 sets" (training-session.page.ts:64).
    await expect(page.getByText(/0 de 1 sets/)).toBeVisible();

    // STEP 8: Increment weight by 2.5 kg (domain Weight requires value > 0).
    // Weight.tryFrom(0) fails, so we must set a positive value before submitting.
    // Reps defaults to 0 which is valid per Reps.tryFrom (requires non-negative integer).
    const incrementWeight = page.getByRole('button', { name: 'Aumentar peso' });
    await expect(incrementWeight).toBeVisible();
    await incrementWeight.click(); // sets weightKg = 2.5

    // Click "Loguear set".
    const logBtn = page.getByRole('button', { name: 'Loguear set' });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // STEP 9: Counter increments to "1 de 1 sets".
    await expect(page.getByText(/1 de 1 sets/)).toBeVisible();
  });
});
