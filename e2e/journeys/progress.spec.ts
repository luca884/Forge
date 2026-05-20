import { test, expect } from '../fixtures/db-reset';
import {
  seedExercises,
  seedRoutines,
  seedTrainingDays,
  seedSessions,
  seedWorkedSets,
  seedPersonalRecords,
  daysAgo,
  type SeedExercise,
  type SeedRoutine,
  type SeedTrainingDay,
  type SeedSession,
  type SeedWorkedSet,
  type SeedPersonalRecord,
} from '../fixtures/seed';

// ─── J9 — Progress home ───────────────────────────────────────────────────────

test.describe('J9 — Progress home', () => {
  test('J9.1 — progress home con PRs seeded renderiza heatmap + stats + sección', async ({
    page,
  }) => {
    // Boot Angular + Dexie
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
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };

    const sessions: SeedSession[] = [
      {
        id: 's-1',
        routineId: 'rt-1',
        dayId: 'day-1',
        date: new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10),
        startedAt: daysAgo(3),
        endedAt: daysAgo(3),
        status: 'completed',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
      {
        id: 's-2',
        routineId: 'rt-1',
        dayId: 'day-1',
        date: new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10),
        startedAt: daysAgo(7),
        endedAt: daysAgo(7),
        status: 'completed',
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
    ];

    const workedSets: SeedWorkedSet[] = [
      {
        id: 'ws-1',
        sessionId: 's-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: true,
        reps: 5,
        weightKg: 80,
        createdAt: daysAgo(3),
      },
      {
        id: 'ws-2',
        sessionId: 's-2',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: false,
        reps: 5,
        weightKg: 60,
        createdAt: daysAgo(7),
      },
    ];

    const prs: SeedPersonalRecord[] = [
      {
        id: 'pr-1',
        exerciseId: 'ex-1',
        trackingType: 'weight-reps',
        workedSetId: 'ws-1',
        achievedAt: daysAgo(3),
        reps: 5,
        weightKg: 80,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ];

    await seedExercises(page, [exercise]);
    await seedRoutines(page, [routine]);
    await seedTrainingDays(page, [day]);
    await seedSessions(page, sessions);
    await seedWorkedSets(page, workedSets);
    await seedPersonalRecords(page, prs);

    // Navigate to progress
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Page title (fg-page-header now uses <h1> — a11y fix commit ce5c47d)
    await expect(page.getByRole('heading', { name: 'Progreso' })).toBeVisible();

    // Heatmap section
    await expect(page.getByText('ÚLTIMAS 12 SEMANAS')).toBeVisible();

    // Stat cards
    await expect(page.getByText('PRs totales')).toBeVisible();
    await expect(page.getByText('PRs esta semana')).toBeVisible();

    // Recent PRs section
    await expect(page.getByText('ÚLTIMOS PRS')).toBeVisible();

    // "Ver todos los PRs" CTA button
    await expect(page.getByRole('button', { name: 'Ver todos los PRs' })).toBeVisible();
  });

  test('J9.2 — progress home vacío sin PRs muestra empty state', async ({ page }) => {
    // No pre-seed — clean DB from db-reset fixture
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Page title
    await expect(page.getByRole('heading', { name: 'Progreso' })).toBeVisible();

    // Empty state copy (progress-home.page.ts:77-78)
    await expect(page.getByText('Aún no tenés PRs')).toBeVisible();
    await expect(page.getByText('Registra tu primer entrenamiento para empezar.')).toBeVisible();

    // Stat cards still visible with 0 (don't disappear)
    await expect(page.getByText('PRs totales')).toBeVisible();
  });
});

// ─── J10 — PR list ────────────────────────────────────────────────────────────

test.describe('J10 — PR list', () => {
  test('J10 — PR list renderiza cards y navega a historial de ejercicio', async ({ page }) => {
    // Boot Angular + Dexie
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const now = new Date();

    const exercises: SeedExercise[] = [
      {
        id: 'ex-1',
        name: 'Sentadilla',
        muscleGroup: 'legs',
        trackingType: 'weight-reps',
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ex-2',
        name: 'Press banca',
        muscleGroup: 'chest',
        trackingType: 'weight-reps',
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const prs: SeedPersonalRecord[] = [
      {
        id: 'pr-1',
        exerciseId: 'ex-1',
        trackingType: 'weight-reps',
        workedSetId: 'ws-fake-1',
        achievedAt: daysAgo(2),
        reps: 5,
        weightKg: 100,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        id: 'pr-2',
        exerciseId: 'ex-2',
        trackingType: 'weight-reps',
        workedSetId: 'ws-fake-2',
        achievedAt: daysAgo(15),
        reps: 5,
        weightKg: 80,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(15),
      },
    ];

    await seedExercises(page, exercises);
    await seedPersonalRecords(page, prs);

    // Navigate to PR list
    await page.goto('/progress/prs');
    await page.waitForLoadState('networkidle');

    // Page title (fg-page-header with <h1>)
    await expect(page.getByRole('heading', { name: 'Records personales' })).toBeVisible();

    // Filter chips
    await expect(page.getByText('Todos', { exact: true })).toBeVisible();
    await expect(page.getByText('Recientes', { exact: true })).toBeVisible();

    // Exercise cards visible
    await expect(page.locator('fg-card').filter({ hasText: 'Sentadilla' })).toBeVisible();
    await expect(page.locator('fg-card').filter({ hasText: 'Press banca' })).toBeVisible();

    // Click Sentadilla card button → navigate to exercise history
    await page
      .locator('fg-card')
      .filter({ hasText: 'Sentadilla' })
      .getByRole('button')
      .click();

    await expect(page).toHaveURL(/\/progress\/exercise\/ex-1$/);
  });
});

// ─── J11 — Exercise history ───────────────────────────────────────────────────

test.describe('J11 — Exercise history', () => {
  test('J11 — historial de ejercicio renderiza chart + stats + sets agrupados', async ({
    page,
  }) => {
    // Boot Angular + Dexie
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

    const sessions: SeedSession[] = [
      {
        id: 's-a',
        routineId: 'rt-x',
        dayId: 'day-x',
        date: new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10),
        startedAt: daysAgo(7),
        endedAt: daysAgo(7),
        status: 'completed',
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
      {
        id: 's-b',
        routineId: 'rt-x',
        dayId: 'day-x',
        date: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10),
        startedAt: daysAgo(2),
        endedAt: daysAgo(2),
        status: 'completed',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
    ];

    // 4 worked sets across 2 sessions — minimum for chart to render non-empty
    const workedSets: SeedWorkedSet[] = [
      {
        id: 'ws-1',
        sessionId: 's-a',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: false,
        reps: 5,
        weightKg: 60,
        createdAt: daysAgo(7),
      },
      {
        id: 'ws-2',
        sessionId: 's-a',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: false,
        reps: 5,
        weightKg: 65,
        createdAt: daysAgo(7),
      },
      {
        id: 'ws-3',
        sessionId: 's-b',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: false,
        reps: 5,
        weightKg: 70,
        createdAt: daysAgo(2),
      },
      {
        id: 'ws-4',
        sessionId: 's-b',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: true,
        reps: 5,
        weightKg: 80,
        createdAt: daysAgo(2),
      },
    ];

    const prs: SeedPersonalRecord[] = [
      {
        id: 'pr-1',
        exerciseId: 'ex-1',
        trackingType: 'weight-reps',
        workedSetId: 'ws-4',
        achievedAt: daysAgo(2),
        reps: 5,
        weightKg: 80,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
    ];

    await seedExercises(page, [exercise]);
    await seedSessions(page, sessions);
    await seedWorkedSets(page, workedSets);
    await seedPersonalRecords(page, prs);

    // Navigate to exercise history
    await page.goto('/progress/exercise/ex-1');
    await page.waitForLoadState('networkidle');

    // Page title (fg-page-header with <h1>)
    await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();

    // Chart canvas (exercise-history-chart.component → line-chart → <canvas>)
    await expect(page.locator('fg-exercise-history-chart canvas')).toBeVisible();

    // 3-stat tiles
    await expect(page.getByText('Mejor', { exact: true })).toBeVisible();
    await expect(page.getByText('Mejor reps')).toBeVisible();
    await expect(page.getByText('1RM est.')).toBeVisible();

    // ÚLTIMOS SETS section
    await expect(page.getByText('ÚLTIMOS SETS')).toBeVisible();
  });
});
