/**
 * ProgressionTargetCalculator spec — TDD strict (RED first).
 * Doble progresión: dado el mejor set de la sesión anterior, calcula el objetivo a superar.
 */
import { TestBed } from '@angular/core/testing';
import { ProgressionTargetCalculator } from './progression-target-calculator';
import { WorkedSet, WeightRepsSet, BodyweightRepsSet, TimeSet, DistanceTimeSet } from '../worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWeightRepsSet(
  reps: number,
  weightKg: number,
  sessionId: string,
  createdAt: Date,
  overrides: Partial<WeightRepsSet> = {},
): WeightRepsSet {
  return {
    id: `wr-${Math.random()}`,
    sessionId,
    exerciseId: 'ex-1',
    isPR: false,
    createdAt,
    type: 'weight-reps',
    reps: new Reps(reps),
    weight: new Weight(weightKg),
    ...overrides,
  };
}

function makeBodyweightSet(
  reps: number,
  extraWeightKg: number | undefined,
  sessionId: string,
  createdAt: Date,
  overrides: Partial<BodyweightRepsSet> = {},
): BodyweightRepsSet {
  return {
    id: `bw-${Math.random()}`,
    sessionId,
    exerciseId: 'ex-1',
    isPR: false,
    createdAt,
    type: 'bodyweight-reps',
    reps: new Reps(reps),
    extraWeight: extraWeightKg !== undefined ? new Weight(extraWeightKg) : undefined,
    ...overrides,
  };
}

function makeTimeSet(sessionId: string, createdAt: Date): TimeSet {
  return {
    id: `time-${Math.random()}`,
    sessionId,
    exerciseId: 'ex-1',
    isPR: false,
    createdAt,
    type: 'time',
    durationSec: 60,
  };
}

function makeDistanceTimeSet(sessionId: string, createdAt: Date): DistanceTimeSet {
  return {
    id: `dist-${Math.random()}`,
    sessionId,
    exerciseId: 'ex-1',
    isPR: false,
    createdAt,
    type: 'distance-time',
    distanceKm: 5,
    durationSec: 1800,
  };
}

const jan1 = new Date('2026-01-01T10:00:00Z');
const jan2 = new Date('2026-01-02T10:00:00Z');
const jan3 = new Date('2026-01-03T10:00:00Z');

const ACTIVE_SESSION = 'active-session';
const PREV_SESSION_1 = 'prev-session-1';
const PREV_SESSION_2 = 'prev-session-2';

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ProgressionTargetCalculator', () => {
  let calc: ProgressionTargetCalculator;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProgressionTargetCalculator] });
    calc = TestBed.inject(ProgressionTargetCalculator);
  });

  // ── selectBestPreviousSet ─────────────────────────────────────────────────

  describe('selectBestPreviousSet()', () => {
    it('returns null when history is empty', () => {
      expect(calc.selectBestPreviousSet([], ACTIVE_SESSION)).toBeNull();
    });

    it('returns null when all sets belong to the active session', () => {
      const sets: WorkedSet[] = [
        makeWeightRepsSet(10, 80, ACTIVE_SESSION, jan1),
        makeWeightRepsSet(8, 85, ACTIVE_SESSION, jan2),
      ];
      expect(calc.selectBestPreviousSet(sets, ACTIVE_SESSION)).toBeNull();
    });

    it('selects the set from the most recent past session (greatest createdAt among non-active sets)', () => {
      const older = makeWeightRepsSet(10, 80, PREV_SESSION_1, jan1);
      const newer = makeWeightRepsSet(8, 90, PREV_SESSION_2, jan2);
      const active = makeWeightRepsSet(6, 100, ACTIVE_SESSION, jan3);
      const result = calc.selectBestPreviousSet([older, newer, active], ACTIVE_SESSION);
      // Both prev-session-2 sets in newer — newest createdAt → prev-session-2
      expect(result?.sessionId).toBe(PREV_SESSION_2);
    });

    it('picks the heaviest-weight set from the most recent session (weight-reps)', () => {
      const s1a = makeWeightRepsSet(10, 80, PREV_SESSION_1, jan1);
      const s1b = makeWeightRepsSet(10, 90, PREV_SESSION_1, jan1); // same session, heavier
      const result = calc.selectBestPreviousSet([s1a, s1b], ACTIVE_SESSION);
      expect((result as WeightRepsSet).weight.value).toBe(90);
    });

    it('breaks weight tie with more reps (weight-reps)', () => {
      const s1a = makeWeightRepsSet(8, 100, PREV_SESSION_1, jan1);
      const s1b = makeWeightRepsSet(10, 100, PREV_SESSION_1, jan1); // same weight, more reps
      const result = calc.selectBestPreviousSet([s1a, s1b], ACTIVE_SESSION);
      expect((result as WeightRepsSet).reps.value).toBe(10);
    });

    it('picks the heaviest extraWeight for bodyweight-reps (treating undefined as 0)', () => {
      const noExtra = makeBodyweightSet(10, undefined, PREV_SESSION_1, jan1);
      const withExtra = makeBodyweightSet(10, 20, PREV_SESSION_1, jan1); // 20kg lastre
      const result = calc.selectBestPreviousSet([noExtra, withExtra], ACTIVE_SESSION);
      expect((result as BodyweightRepsSet).extraWeight?.value).toBe(20);
    });

    it('breaks extraWeight tie with more reps (bodyweight-reps)', () => {
      const a = makeBodyweightSet(8, 10, PREV_SESSION_1, jan1);
      const b = makeBodyweightSet(12, 10, PREV_SESSION_1, jan1); // same lastre, more reps
      const result = calc.selectBestPreviousSet([a, b], ACTIVE_SESSION);
      expect((result as BodyweightRepsSet).reps.value).toBe(12);
    });

    it('ignores mixed set types and picks best from the resolved session type', () => {
      // The most recent session has both weight-reps and bodyweight-reps sets
      // selectBestPreviousSet should still work (caller ensures single tracking type)
      const wr = makeWeightRepsSet(10, 80, PREV_SESSION_1, jan2);
      const active = makeWeightRepsSet(8, 80, ACTIVE_SESSION, jan3);
      const result = calc.selectBestPreviousSet([wr, active], ACTIVE_SESSION);
      expect(result?.sessionId).toBe(PREV_SESSION_1);
    });
  });

  // ── calculateTarget (weight-reps) ─────────────────────────────────────────

  describe('calculateTarget() — weight-reps', () => {
    it('returns null when previousBestSet is null (first time ever)', () => {
      expect(calc.calculateTarget(null, 8, 'weight-reps')).toBeNull();
    });

    it('reps >= targetReps → increase weight by 2.5, reset reps to targetReps', () => {
      const prev = makeWeightRepsSet(8, 80, PREV_SESSION_1, jan1); // reps=8, weight=80
      const target = calc.calculateTarget(prev, 8, 'weight-reps'); // targetReps=8
      expect(target).not.toBeNull();
      expect(target!.weightKg).toBe(82.5);
      expect(target!.reps).toBe(8);
      expect(target!.previousBest.weightKg).toBe(80);
      expect(target!.previousBest.reps).toBe(8);
    });

    it('reps > targetReps → still increase weight (reps >= targetReps covers this)', () => {
      const prev = makeWeightRepsSet(10, 80, PREV_SESSION_1, jan1); // reps=10 > targetReps=8
      const target = calc.calculateTarget(prev, 8, 'weight-reps');
      expect(target!.weightKg).toBe(82.5);
      expect(target!.reps).toBe(8);
    });

    it('reps < targetReps → same weight, reps + 1', () => {
      const prev = makeWeightRepsSet(6, 80, PREV_SESSION_1, jan1); // reps=6 < targetReps=8
      const target = calc.calculateTarget(prev, 8, 'weight-reps');
      expect(target!.weightKg).toBe(80);
      expect(target!.reps).toBe(7); // 6+1
      expect(target!.previousBest.weightKg).toBe(80);
      expect(target!.previousBest.reps).toBe(6);
    });

    it('custom increment — uses provided value instead of 2.5', () => {
      const prev = makeWeightRepsSet(8, 80, PREV_SESSION_1, jan1);
      const target = calc.calculateTarget(prev, 8, 'weight-reps', 5);
      expect(target!.weightKg).toBe(85);
    });

    it('does not set extraWeightKg for weight-reps target', () => {
      const prev = makeWeightRepsSet(8, 80, PREV_SESSION_1, jan1);
      const target = calc.calculateTarget(prev, 8, 'weight-reps');
      expect(target!.extraWeightKg).toBeUndefined();
    });
  });

  // ── calculateTarget (bodyweight-reps) ────────────────────────────────────

  describe('calculateTarget() — bodyweight-reps', () => {
    it('returns null when previousBestSet is null', () => {
      expect(calc.calculateTarget(null, 8, 'bodyweight-reps')).toBeNull();
    });

    it('always +1 rep, maintains extraWeight', () => {
      const prev = makeBodyweightSet(10, 20, PREV_SESSION_1, jan1);
      const target = calc.calculateTarget(prev, 8, 'bodyweight-reps');
      expect(target!.reps).toBe(11);
      expect(target!.extraWeightKg).toBe(20);
      expect(target!.previousBest.reps).toBe(10);
      expect(target!.previousBest.extraWeightKg).toBe(20);
    });

    it('works when extraWeight is undefined (no lastre)', () => {
      const prev = makeBodyweightSet(10, undefined, PREV_SESSION_1, jan1);
      const target = calc.calculateTarget(prev, 8, 'bodyweight-reps');
      expect(target!.reps).toBe(11);
      expect(target!.extraWeightKg).toBeUndefined();
    });

    it('does not set weightKg for bodyweight-reps target', () => {
      const prev = makeBodyweightSet(10, undefined, PREV_SESSION_1, jan1);
      const target = calc.calculateTarget(prev, 8, 'bodyweight-reps');
      expect(target!.weightKg).toBeUndefined();
    });

    it('targetReps parameter has no effect on bodyweight result', () => {
      const prev = makeBodyweightSet(10, 5, PREV_SESSION_1, jan1);
      // targetReps=12 or 6 — should give same +1 result
      const t1 = calc.calculateTarget(prev, 12, 'bodyweight-reps');
      const t2 = calc.calculateTarget(prev, 6, 'bodyweight-reps');
      expect(t1!.reps).toBe(11);
      expect(t2!.reps).toBe(11);
    });
  });

  // ── calculateTarget (time / distance-time) ───────────────────────────────

  describe('calculateTarget() — time and distance-time', () => {
    it('returns null for time type regardless of history', () => {
      const prev = makeTimeSet(PREV_SESSION_1, jan1);
      expect(calc.calculateTarget(prev, 60, 'time')).toBeNull();
    });

    it('returns null for distance-time type regardless of history', () => {
      const prev = makeDistanceTimeSet(PREV_SESSION_1, jan1);
      expect(calc.calculateTarget(prev, 0, 'distance-time')).toBeNull();
    });
  });

  // ── formatTarget ─────────────────────────────────────────────────────────

  describe('formatTarget()', () => {
    it('formats weight-reps target as "Xkg × Y"', () => {
      const target = { weightKg: 82.5, reps: 8, previousBest: { weightKg: 80, reps: 8 } };
      expect(calc.formatTarget(target)).toBe('82.5kg × 8');
    });

    it('formats weight-reps without trailing .0 on integer weights', () => {
      const target = { weightKg: 80, reps: 8, previousBest: { weightKg: 77.5, reps: 8 } };
      expect(calc.formatTarget(target)).toBe('80kg × 8');
    });

    it('formats bodyweight-reps (no extra weight) as "X reps"', () => {
      const target = { reps: 11, previousBest: { reps: 10 } };
      expect(calc.formatTarget(target)).toBe('11 reps');
    });

    it('formats bodyweight-reps (with extra weight) as "X reps (+Ykg lastre)"', () => {
      const target = { reps: 11, extraWeightKg: 20, previousBest: { reps: 10, extraWeightKg: 20 } };
      expect(calc.formatTarget(target)).toBe('11 reps (+20kg lastre)');
    });

    it('formats previousBest for weight-reps as "Xkg × Y"', () => {
      const target = { weightKg: 82.5, reps: 8, previousBest: { weightKg: 80, reps: 8 } };
      expect(calc.formatPreviousBest(target.previousBest)).toBe('80kg × 8');
    });

    it('formats previousBest for bodyweight as "X reps"', () => {
      const target = { reps: 11, previousBest: { reps: 10 } };
      expect(calc.formatPreviousBest(target.previousBest)).toBe('10 reps');
    });
  });

  // ── meetsTarget (slice 2: feedback objetivo cumplido) ────────────────────

  describe('meetsTarget()', () => {
    const wrTarget = { weightKg: 82.5, reps: 8, previousBest: { weightKg: 80, reps: 8 } };
    const bwTarget = { extraWeightKg: 20, reps: 11, previousBest: { extraWeightKg: 20, reps: 10 } };
    const bwNoExtraTarget = { reps: 11, previousBest: { reps: 10 } };

    it('returns false when target is null', () => {
      const set = makeWeightRepsSet(8, 82.5, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, null)).toBe(false);
    });

    // weight-reps
    it('weight-reps: returns true when set meets target exactly (>=)', () => {
      const set = makeWeightRepsSet(8, 82.5, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(true);
    });

    it('weight-reps: returns true when set exceeds target (more weight and reps)', () => {
      const set = makeWeightRepsSet(10, 85, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(true);
    });

    it('weight-reps: returns false when weight ok but reps short', () => {
      const set = makeWeightRepsSet(7, 82.5, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });

    it('weight-reps: returns false when reps ok but weight short', () => {
      const set = makeWeightRepsSet(8, 80, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });

    it('weight-reps: returns false when both short', () => {
      const set = makeWeightRepsSet(6, 75, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });

    // bodyweight-reps
    it('bodyweight-reps: returns true when extraWeight and reps meet target exactly', () => {
      const set = makeBodyweightSet(11, 20, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(true);
    });

    it('bodyweight-reps: returns true when reps exceed and extraWeight matches', () => {
      const set = makeBodyweightSet(13, 25, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(true);
    });

    it('bodyweight-reps: returns false when reps short', () => {
      const set = makeBodyweightSet(10, 20, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(false);
    });

    it('bodyweight-reps: returns false when extraWeight short', () => {
      const set = makeBodyweightSet(11, 15, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(false);
    });

    it('bodyweight-reps: undefined extraWeight treated as 0 — meets target with no lastre', () => {
      const set = makeBodyweightSet(11, undefined, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwNoExtraTarget)).toBe(true);
    });

    it('bodyweight-reps: undefined extraWeight (0) does NOT meet a target that requires lastre', () => {
      const set = makeBodyweightSet(11, undefined, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(false);
    });

    // type guard: set type != target type
    it('returns false when set type does not match target type (weight-reps set vs bodyweight target)', () => {
      const set = makeWeightRepsSet(11, 82.5, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, bwTarget)).toBe(false);
    });

    it('returns false when set type does not match target type (bodyweight set vs weight-reps target)', () => {
      const set = makeBodyweightSet(8, 100, ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });

    // time / distance-time
    it('returns false for time set', () => {
      const set = makeTimeSet(ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });

    it('returns false for distance-time set', () => {
      const set = makeDistanceTimeSet(ACTIVE_SESSION, jan1);
      expect(calc.meetsTarget(set, wrTarget)).toBe(false);
    });
  });
});
