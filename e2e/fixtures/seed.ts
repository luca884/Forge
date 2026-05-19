import type { Page } from '@playwright/test';

/**
 * Seed helpers for Forge E2E tests.
 *
 * IMPORTANT — navigate-first contract:
 *   Callers MUST call `page.goto('/')` + `page.waitForLoadState('networkidle')`
 *   BEFORE any seed helper. Angular must have booted and Dexie must have opened
 *   the `'forge'` database (creating all stores at v3) before these helpers run.
 *
 *   If called before navigation, `indexedDB.open('forge')` inside `page.evaluate`
 *   will trigger `onupgradeneeded` on a fresh DB (version 0 → 1 with no stores),
 *   and `objectStore(...)` will throw `NotFoundError`.
 *
 * Schema reference: src/app/core/db/database.ts (v3)
 * Row shapes: src/app/features/routines/data/routine.mapper.ts
 *             src/app/features/routines/data/training-day.mapper.ts
 *             src/app/features/exercises/data/exercise.mapper.ts (if exists)
 *
 * NOTE: These interfaces duplicate the DB row shapes intentionally — e2e code
 * has NO import from `src/` to keep the test layer fully decoupled. If the DB
 * schema changes (new version in database.ts), mirror the change here.
 */

// ---------------------------------------------------------------------------
// Row shape interfaces (mirror src/app/core/db/database.ts)
// ---------------------------------------------------------------------------

export interface SeedWeeklySchedule {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface SeedTargetSetWeightReps {
  type: 'weight-reps';
  reps: number;
  weightKg?: number;
}

export interface SeedTargetSetBodyweightReps {
  type: 'bodyweight-reps';
  reps: number;
  extraWeightKg?: number;
}

export interface SeedTargetSetTime {
  type: 'time';
  durationSec: number;
}

export interface SeedTargetSetDistanceTime {
  type: 'distance-time';
  distanceKm: number;
  durationSec: number;
}

export type SeedTargetSet =
  | SeedTargetSetWeightReps
  | SeedTargetSetBodyweightReps
  | SeedTargetSetTime
  | SeedTargetSetDistanceTime;

export interface SeedExerciseInDay {
  exerciseId: string;
  order: number;
  targetSets: SeedTargetSet[];
  restSeconds?: number;
  note?: string;
}

export interface SeedExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  trackingType: string; // 'weight-reps' | 'bodyweight-reps' | 'time' | 'distance-time'
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedRoutine {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  schedule: SeedWeeklySchedule | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedTrainingDay {
  id: string;
  routineId: string;
  name: string;
  label?: string;
  exercises: SeedExerciseInDay[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Internal helper — opens the already-existing 'forge' DB (no version specified
// so the current schema is used as-is) and puts rows into the given store.
// ---------------------------------------------------------------------------

async function putRows<T>(page: Page, storeName: string, rows: readonly T[]): Promise<void> {
  const serializedArg: { storeName: string; rows: readonly unknown[] } = {
    storeName,
    rows: rows as readonly unknown[],
  };
  await page.evaluate(
    async (arg: { storeName: string; rows: readonly unknown[] }) => {
      // Open WITHOUT specifying a version — Dexie already opened it at v3 during
      // Angular bootstrap, so this returns the existing DB without triggering
      // onupgradeneeded.
      const db: IDBDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('forge');
        req.onsuccess = (): void => resolve(req.result);
        req.onerror = (): void =>
          reject(new Error(`[seed] IDB open error on '${arg.storeName}': ${String(req.error)}`));
        // No onupgradeneeded — we rely on Dexie having already created the schema.
      });

      const tx = db.transaction(arg.storeName, 'readwrite');
      const store = tx.objectStore(arg.storeName);

      for (const row of arg.rows) {
        store.put(row as IDBValidKey);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = (): void => resolve();
        tx.onerror = (): void =>
          reject(
            new Error(
              `[seed] Transaction error on '${arg.storeName}': ${String(tx.error)}`,
            ),
          );
        tx.onabort = (): void =>
          reject(
            new Error(
              `[seed] Transaction aborted on '${arg.storeName}': ${String(tx.error)}`,
            ),
          );
      });

      db.close();
    },
    serializedArg,
  );
}

// ---------------------------------------------------------------------------
// Public seed helpers
// ---------------------------------------------------------------------------

/**
 * Seeds exercise rows into the `exercises` store.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedExercises(page: Page, rows: readonly SeedExercise[]): Promise<void> {
  await putRows(page, 'exercises', rows);
}

/**
 * Seeds routine rows into the `routines` store.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedRoutines(page: Page, rows: readonly SeedRoutine[]): Promise<void> {
  await putRows(page, 'routines', rows);
}

/**
 * Seeds training day rows into the `trainingDays` store.
 * The `exercises` field must match the `ExerciseInDayRow[]` shape expected by the mapper.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedTrainingDays(
  page: Page,
  rows: readonly SeedTrainingDay[],
): Promise<void> {
  await putRows(page, 'trainingDays', rows);
}
