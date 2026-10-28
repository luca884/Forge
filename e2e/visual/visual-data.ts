import type { Page } from '@playwright/test';
import {
  seedExercises,
  seedPersonalRecords,
  seedProfile,
  seedRoutines,
  seedSessions,
  seedTrainingDays,
  seedWorkedSets,
  type SeedExercise,
  type SeedPersonalRecord,
  type SeedRoutine,
  type SeedSession,
  type SeedTrainingDay,
  type SeedWorkedSet,
} from '../fixtures/seed';

/**
 * Deterministic dataset for the visual journey.
 *
 * Every date is derived from FIXED_NOW (Tuesday 2026-10-27 10:00 in Buenos
 * Aires), the same instant the spec pins with `page.clock.setFixedTime`, so
 * "Hoy", the heatmap and the relative dates never drift from one day to the
 * next. Ids are literals, never generated.
 */

/** Tuesday 2026-10-27 10:00 America/Argentina/Buenos_Aires (UTC-3). */
export const FIXED_NOW = new Date('2026-10-27T13:00:00.000Z');

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/** The instant `n` days before FIXED_NOW (same wall-clock time). */
export function ago(n: number): Date {
  return new Date(FIXED_NOW.getTime() - n * DAY_MS);
}

/** The instant `minutes` minutes before FIXED_NOW. */
export function minutesAgo(minutes: number): Date {
  return new Date(FIXED_NOW.getTime() - minutes * MINUTE_MS);
}

/** Local (Buenos Aires) YYYY-MM-DD for the instant `n` days before FIXED_NOW. */
export function dateStr(n: number): string {
  return ago(n).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

const CREATED = ago(60);

function exercise(
  id: string,
  name: string,
  muscleGroup: string,
  equipment: string,
): SeedExercise {
  return {
    id,
    name,
    muscleGroup,
    equipment,
    trackingType: 'weight-reps',
    isCustom: false,
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

export const EXERCISES: readonly SeedExercise[] = [
  exercise('ex-sentadilla', 'Sentadilla', 'legs', 'barbell'),
  exercise('ex-peso-muerto', 'Peso muerto', 'back', 'barbell'),
  exercise('ex-prensa', 'Prensa de piernas', 'legs', 'machine'),
  exercise('ex-press-banca', 'Press de banca', 'chest', 'barbell'),
  exercise('ex-remo', 'Remo con barra', 'back', 'barbell'),
  exercise('ex-press-militar', 'Press militar', 'shoulders', 'barbell'),
  exercise('ex-dominadas', 'Dominadas', 'back', 'bodyweight'),
  exercise('ex-curl-biceps', 'Curl de bíceps', 'biceps', 'dumbbell'),
  exercise('ex-triceps-polea', 'Extensión de tríceps en polea', 'triceps', 'cable'),
  exercise('ex-curl-femoral', 'Curl femoral', 'legs', 'machine'),
];

const ROUTINE_ID = 'rt-torso-pierna';

export const ROUTINES: readonly SeedRoutine[] = [
  {
    id: ROUTINE_ID,
    name: 'Torso / Pierna',
    description: 'Cuatro días por semana, dos de torso y dos de pierna.',
    isActive: true,
    schedule: {
      monday: 'day-torso-a',
      tuesday: 'day-pierna-a',
      thursday: 'day-torso-b',
      friday: 'day-pierna-b',
    },
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'rt-full-body',
    name: 'Full body',
    description: 'Tres días de cuerpo completo.',
    isActive: false,
    schedule: null,
    createdAt: CREATED,
    updatedAt: CREATED,
  },
];

function day(
  id: string,
  name: string,
  label: string,
  exercises: SeedTrainingDay['exercises'],
): SeedTrainingDay {
  return { id, routineId: ROUTINE_ID, name, label, exercises, createdAt: CREATED, updatedAt: CREATED };
}

function sets(count: number, reps: number, weightKg: number): SeedTrainingDay['exercises'][number]['targetSets'] {
  return Array.from({ length: count }, () => ({ type: 'weight-reps' as const, reps, weightKg }));
}

export const TRAINING_DAYS: readonly SeedTrainingDay[] = [
  day('day-torso-a', 'Torso A', 'A', [
    { exerciseId: 'ex-press-banca', order: 0, targetSets: sets(4, 6, 70), restSeconds: 120 },
    { exerciseId: 'ex-remo', order: 1, targetSets: sets(4, 8, 60) },
    { exerciseId: 'ex-press-militar', order: 2, targetSets: sets(3, 8, 40) },
  ]),
  day('day-pierna-a', 'Pierna A', 'B', [
    { exerciseId: 'ex-sentadilla', order: 0, targetSets: sets(4, 5, 100), restSeconds: 180 },
    { exerciseId: 'ex-peso-muerto', order: 1, targetSets: sets(3, 5, 120) },
    { exerciseId: 'ex-prensa', order: 2, targetSets: sets(3, 10, 180) },
  ]),
  day('day-torso-b', 'Torso B', 'C', [
    { exerciseId: 'ex-dominadas', order: 0, targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 10 }] },
    { exerciseId: 'ex-curl-biceps', order: 1, targetSets: sets(3, 12, 14) },
  ]),
  day('day-pierna-b', 'Pierna B', 'D', [
    { exerciseId: 'ex-prensa', order: 0, targetSets: sets(4, 10, 180) },
    { exerciseId: 'ex-curl-femoral', order: 1, targetSets: sets(3, 12, 45) },
  ]),
];

interface Plan {
  readonly dayId: string;
  readonly offsets: readonly number[];
  readonly lifts: readonly { exerciseId: string; baseKg: number; reps: number; step: number }[];
}

// Today is a Tuesday: Mondays are 1 + 7k days back, Tuesdays 7k, Thursdays 5 + 7k.
const PLANS: readonly Plan[] = [
  {
    dayId: 'day-torso-a',
    offsets: [1, 8, 15, 22, 29, 36, 43, 50],
    lifts: [
      { exerciseId: 'ex-press-banca', baseKg: 55, reps: 6, step: 2.5 },
      { exerciseId: 'ex-remo', baseKg: 45, reps: 8, step: 2.5 },
    ],
  },
  {
    dayId: 'day-pierna-a',
    offsets: [7, 14, 21, 28, 35, 42, 49, 56],
    lifts: [
      { exerciseId: 'ex-sentadilla', baseKg: 80, reps: 5, step: 2.5 },
      { exerciseId: 'ex-peso-muerto', baseKg: 100, reps: 5, step: 5 },
    ],
  },
  {
    dayId: 'day-torso-b',
    offsets: [5, 12, 19, 26, 33, 40, 47],
    lifts: [{ exerciseId: 'ex-curl-biceps', baseKg: 10, reps: 12, step: 1 }],
  },
];

const SETS_PER_LIFT = 3;

function buildHistory(): { sessions: SeedSession[]; workedSets: SeedWorkedSet[]; prs: SeedPersonalRecord[] } {
  const sessions: SeedSession[] = [];
  const workedSets: SeedWorkedSet[] = [];
  const bestByExercise = new Map<string, SeedWorkedSet>();

  for (const plan of PLANS) {
    plan.offsets.forEach((offset, index) => {
      // index 0 is the most recent session, so older sessions lift less.
      const sessionId = `sess-${plan.dayId}-${offset}`;
      const started = new Date(ago(offset).getTime() - 2 * 3_600_000);
      const ended = new Date(started.getTime() + 55 * MINUTE_MS);
      sessions.push({
        id: sessionId,
        routineId: ROUTINE_ID,
        dayId: plan.dayId,
        date: dateStr(offset),
        startedAt: started,
        endedAt: ended,
        status: 'completed',
        createdAt: started,
        updatedAt: ended,
      });

      for (const lift of plan.lifts) {
        const weightKg = lift.baseKg + lift.step * (plan.offsets.length - 1 - index);
        for (let i = 0; i < SETS_PER_LIFT; i++) {
          const set: SeedWorkedSet = {
            id: `ws-${sessionId}-${lift.exerciseId}-${i}`,
            sessionId,
            exerciseId: lift.exerciseId,
            type: 'weight-reps',
            targetSetIndex: i,
            reps: lift.reps,
            weightKg,
            isPR: index === 0 && i === 0,
            createdAt: new Date(started.getTime() + (10 + i * 4) * MINUTE_MS),
          };
          workedSets.push(set);
          if (index === 0 && i === 0) bestByExercise.set(lift.exerciseId, set);
        }
      }
    });
  }

  const prs: SeedPersonalRecord[] = [...bestByExercise.entries()].map(([exerciseId, set]) => ({
    id: `pr-${exerciseId}`,
    exerciseId,
    trackingType: 'weight-reps',
    workedSetId: set.id,
    achievedAt: set.createdAt,
    reps: set.reps,
    weightKg: set.weightKg,
    createdAt: set.createdAt,
    updatedAt: set.createdAt,
  }));

  return { sessions, workedSets, prs };
}

/** The session running "now": Pierna A, started 35 minutes ago, 3 of 4 squat sets done. */
export const ACTIVE_SESSION_ID = 'sess-active';

function buildActiveSession(): { session: SeedSession; workedSets: SeedWorkedSet[] } {
  const startedAt = minutesAgo(35);
  const session: SeedSession = {
    id: ACTIVE_SESSION_ID,
    routineId: ROUTINE_ID,
    dayId: 'day-pierna-a',
    date: dateStr(0),
    startedAt,
    status: 'in-progress',
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  const workedSets: SeedWorkedSet[] = [0, 1, 2].map((i) => ({
    id: `ws-active-sentadilla-${i}`,
    sessionId: ACTIVE_SESSION_ID,
    exerciseId: 'ex-sentadilla',
    type: 'weight-reps',
    targetSetIndex: i,
    reps: 5,
    weightKg: 100,
    isPR: false,
    // Far enough back that the last logged set is not "just now".
    createdAt: minutesAgo(25 - i * 6),
  }));

  return { session, workedSets };
}

export interface SeedOptions {
  /** Add a session in progress with a few sets already logged. */
  readonly activeSession?: boolean;
}

/**
 * Seeds the full dataset. The page must already have navigated to the app so
 * Dexie created the schema (navigate-first contract of the seed helpers).
 */
export async function seedVisualData(page: Page, options: SeedOptions = {}): Promise<void> {
  const history = buildHistory();
  const sessions = [...history.sessions];
  const workedSets = [...history.workedSets];

  if (options.activeSession) {
    const active = buildActiveSession();
    sessions.push(active.session);
    workedSets.push(...active.workedSets);
  }

  await seedExercises(page, EXERCISES);
  await seedRoutines(page, ROUTINES);
  await seedTrainingDays(page, TRAINING_DAYS);
  await seedSessions(page, sessions);
  await seedWorkedSets(page, workedSets);
  await seedPersonalRecords(page, history.prs);
  await seedProfile(page, {
    id: 'me',
    name: 'Luca',
    preferredUnit: 'kg',
    createdAt: CREATED,
    updatedAt: CREATED,
  });
}
