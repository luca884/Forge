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

// ─── Time helper ─────────────────────────────────────────────────────────────

/**
 * Returns a Date `n` days ago (current time minus `n * 86_400_000` ms).
 * Use for time-relative seed data so PR filter windows (`> Date.now() - 7d`)
 * stay deterministic across runs without hard-coded dates.
 */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface SeedSession {
  id: string;
  routineId: string;
  dayId: string;
  date: string; // YYYY-MM-DD
  startedAt: Date;
  endedAt?: Date;
  status: 'in-progress' | 'completed' | 'discarded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seeds session rows into the `sessions` store.
 * Mirrors src/app/core/db/database.ts SessionRow.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedSessions(page: Page, rows: readonly SeedSession[]): Promise<void> {
  await putRows(page, 'sessions', rows);
}

// ─── Worked sets ─────────────────────────────────────────────────────────────

export interface SeedWorkedSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  type: 'weight-reps' | 'bodyweight-reps' | 'time' | 'distance-time';
  isPR: boolean;
  createdAt: Date;
  targetSetIndex?: number;
  note?: string;
  reps?: number; // required for weight-reps + bodyweight-reps
  weightKg?: number; // required > 0 for weight-reps (Weight.tryFrom invariant)
  extraWeightKg?: number;
  durationSec?: number;
  distanceKm?: number;
}

/**
 * Seeds worked set rows into the `workedSets` store.
 * Mirrors WorkedSetRow. weightKg MUST be > 0 for type 'weight-reps' (Weight.tryFrom invariant).
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedWorkedSets(page: Page, rows: readonly SeedWorkedSet[]): Promise<void> {
  await putRows(page, 'workedSets', rows);
}

// ─── Personal records ────────────────────────────────────────────────────────

export interface SeedPersonalRecord {
  id: string;
  exerciseId: string;
  trackingType: 'weight-reps' | 'bodyweight-reps' | 'time' | 'distance-time';
  workedSetId: string; // FK-like; mapper does NOT join workedSets — any non-empty string is fine for test data
  achievedAt: Date;
  reps?: number;
  weightKg?: number;
  extraWeightKg?: number;
  durationSec?: number;
  distanceKm?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seeds personal record rows into the `personalRecords` store.
 * Mirrors PersonalRecordRow. workedSetId FK is not validated by IDB — any non-empty string is fine for test data.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedPersonalRecords(
  page: Page,
  rows: readonly SeedPersonalRecord[],
): Promise<void> {
  await putRows(page, 'personalRecords', rows);
}

// ─── Profile (singleton) ─────────────────────────────────────────────────────

export interface SeedProfile {
  id: 'me';
  name: string;
  avatarBase64?: string;
  preferredUnit?: 'kg' | 'lb';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seeds the singleton profile row into the `profile` store.
 * Mirrors ProfileRow (keyPath = literal 'me' singleton). Idempotent — IDB put overwrites by keyPath.
 *
 * Caller MUST `page.goto('/')` + `waitForLoadState('networkidle')` BEFORE calling.
 */
export async function seedProfile(page: Page, row: SeedProfile): Promise<void> {
  await putRows(page, 'profile', [row]);
}
