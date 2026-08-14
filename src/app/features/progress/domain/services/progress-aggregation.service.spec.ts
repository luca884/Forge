/**
 * Pure aggregation service spec — TDD strict (RED-first).
 * No TestBed, no Angular imports.
 */
import { WorkedSet, WeightRepsSet, BodyweightRepsSet } from '@features/training/domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import {
  IMPROVING_MIN_PCT,
  NO_PROGRESS_MAX_PCT,
  classifyProgressStatus,
  computeOverview,
  computeVolume,
  countSessions,
  deltaPercent,
  exerciseProgressEntries,
  signedImprovementPct,
  weeklyTrendPoints,
} from './progress-aggregation.service';

function wr(sessionId: string, exerciseId: string, weightKg: number, repsValue: number, createdAt: Date): WeightRepsSet {
  return {
    id: `ws-${sessionId}-${exerciseId}-${weightKg}-${repsValue}`,
    sessionId,
    exerciseId,
    type: 'weight-reps',
    reps: new Reps(repsValue),
    weight: new Weight(weightKg),
    isPR: false,
    createdAt,
  };
}

function bw(sessionId: string, exerciseId: string, repsValue: number, extraWeightKg: number | undefined, createdAt: Date): BodyweightRepsSet {
  return {
    id: `ws-${sessionId}-${exerciseId}-bw-${repsValue}`,
    sessionId,
    exerciseId,
    type: 'bodyweight-reps',
    reps: new Reps(repsValue),
    extraWeight: extraWeightKg !== undefined ? new Weight(extraWeightKg) : undefined,
    isPR: false,
    createdAt,
  };
}

function timeSet(sessionId: string, exerciseId: string, durationSec: number, createdAt: Date): WorkedSet {
  return {
    id: `ws-${sessionId}-${exerciseId}-time-${durationSec}`,
    sessionId,
    exerciseId,
    type: 'time',
    durationSec,
    isPR: false,
    createdAt,
  };
}

function distanceSet(sessionId: string, exerciseId: string, distanceKm: number, durationSec: number, createdAt: Date): WorkedSet {
  return {
    id: `ws-${sessionId}-${exerciseId}-dist-${distanceKm}`,
    sessionId,
    exerciseId,
    type: 'distance-time',
    distanceKm,
    durationSec,
    isPR: false,
    createdAt,
  };
}

const exWeight: Exercise = {
  id: 'ex-wr',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const exBw: Exercise = {
  id: 'ex-bw',
  name: 'Pull-ups',
  muscleGroup: 'back',
  trackingType: 'bodyweight-reps',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const exTime: Exercise = {
  id: 'ex-time',
  name: 'Plank',
  muscleGroup: 'core',
  trackingType: 'time',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const exDistance: Exercise = {
  id: 'ex-dist',
  name: 'Running',
  muscleGroup: 'legs',
  trackingType: 'distance-time',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Volume ────────────────────────────────────────────────────────────────
describe('computeVolume', () => {
  it('sums weight-reps and bodyweight-reps with extra weight', () => {
    const sets: WorkedSet[] = [
      wr('s1', 'ex-wr', 80, 5, new Date('2026-07-01')),
      bw('s1', 'ex-bw', 10, 20, new Date('2026-07-01')),
      timeSet('s1', 'ex-time', 60, new Date('2026-07-01')),
      distanceSet('s1', 'ex-dist', 3, 600, new Date('2026-07-01')),
    ];
    expect(computeVolume(sets)).toBe(80 * 5 + 20 * 10);
  });

  it('bodyweight-reps without extra weight contributes 0', () => {
    const sets: WorkedSet[] = [bw('s1', 'ex-bw', 15, undefined, new Date('2026-07-01'))];
    expect(computeVolume(sets)).toBe(0);
  });

  it('empty list returns 0', () => {
    expect(computeVolume([])).toBe(0);
  });
});

// ── Session count ─────────────────────────────────────────────────────────
describe('countSessions', () => {
  it('counts distinct session ids', () => {
    const sets: WorkedSet[] = [
      wr('s1', 'ex-wr', 80, 5, new Date('2026-07-01')),
      wr('s1', 'ex-wr', 80, 5, new Date('2026-07-02')),
      wr('s2', 'ex-wr', 80, 5, new Date('2026-07-03')),
    ];
    expect(countSessions(sets)).toBe(2);
  });

  it('empty list returns 0', () => {
    expect(countSessions([])).toBe(0);
  });
});

// ── Delta percent ─────────────────────────────────────────────────────────
describe('deltaPercent', () => {
  it('computes normal percentage change', () => {
    expect(deltaPercent(100, 115)).toBe(15);
  });

  it('returns null when prior is 0', () => {
    expect(deltaPercent(0, 100)).toBeNull();
  });

  it('returns 0 when both inputs are 0', () => {
    expect(deltaPercent(0, 0)).toBeNull();
  });
});

// ── Signed improvement ────────────────────────────────────────────────────
describe('signedImprovementPct', () => {
  it('returns positive delta for higher-better improvement', () => {
    expect(signedImprovementPct(100, 115, 'higher-better')).toBe(15);
  });

  it('returns negative delta for higher-better regression', () => {
    expect(signedImprovementPct(100, 85, 'higher-better')).toBe(-15);
  });

  it('returns positive delta for lower-better improvement (pace)', () => {
    expect(signedImprovementPct(300, 280, 'lower-better')).toBeCloseTo(6.67, 2);
  });

  it('returns negative delta for lower-better regression', () => {
    expect(signedImprovementPct(300, 320, 'lower-better')).toBeCloseTo(-6.67, 2);
  });

  it('returns null when reference is 0', () => {
    expect(signedImprovementPct(0, 100, 'higher-better')).toBeNull();
  });
});

// ── Status classification ───────────────────────────────────────────────────
describe('classifyProgressStatus', () => {
  it('> 5% is improving', () => {
    expect(classifyProgressStatus(6)).toBe('improving');
    expect(classifyProgressStatus(IMPROVING_MIN_PCT + 1)).toBe('improving');
  });

  it('exactly 5% is stable', () => {
    expect(classifyProgressStatus(5)).toBe('stable');
  });

  it('between -5% and 5% inclusive is stable', () => {
    expect(classifyProgressStatus(3)).toBe('stable');
    expect(classifyProgressStatus(-3)).toBe('stable');
  });

  it('exactly -5% is stable', () => {
    expect(classifyProgressStatus(-5)).toBe('stable');
  });

  it('< -5% is no-progress', () => {
    expect(classifyProgressStatus(-6)).toBe('no-progress');
    expect(classifyProgressStatus(NO_PROGRESS_MAX_PCT - 1)).toBe('no-progress');
  });

  it('null is no-progress', () => {
    expect(classifyProgressStatus(null)).toBe('no-progress');
  });
});

// ── Weekly trend ──────────────────────────────────────────────────────────
/** Monday (00:00 local) of the week that started N weeks before the current one. */
function mondayWeeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - weeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Same day at 10:00 local — keeps sets clear of week boundaries. */
function atTenAm(date: Date): Date {
  const d = new Date(date);
  d.setHours(10, 0, 0, 0);
  return d;
}

describe('weeklyTrendPoints', () => {
  it('returns empty array when weeksBack is 0', () => {
    expect(weeklyTrendPoints([], 0)).toEqual([]);
  });

  it('groups sets by ISO Monday-start week', () => {
    // The window is anchored on today's week, so the dates must be relative:
    // fixed dates fall out of the window as time passes.
    const thisMon = mondayWeeksAgo(0);
    const prevMon = mondayWeeksAgo(1);
    const prevSun = addDays(prevMon, 6);

    const sets: WorkedSet[] = [
      wr('s1', 'ex-wr', 100, 5, atTenAm(prevMon)),
      wr('s2', 'ex-wr', 100, 5, atTenAm(prevSun)),
      wr('s3', 'ex-wr', 100, 5, atTenAm(thisMon)),
    ];

    const result = weeklyTrendPoints(sets, 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.weekStart).toBe(prevMon.toLocaleDateString('en-CA'));
    expect(result[0]!.volumeKg).toBe(100 * 5 * 2);
    expect(result[0]!.sessions).toBe(2);
    expect(result[1]!.weekStart).toBe(thisMon.toLocaleDateString('en-CA'));
    expect(result[1]!.volumeKg).toBe(100 * 5);
    expect(result[1]!.sessions).toBe(1);
  });

  it('zero-fills gaps', () => {
    const twoWeeksAgo = mondayWeeksAgo(2);
    const oneWeekAgo = mondayWeeksAgo(1);
    const thisMon = mondayWeeksAgo(0);

    const sets: WorkedSet[] = [
      wr('s1', 'ex-wr', 100, 5, atTenAm(twoWeeksAgo)),
      wr('s2', 'ex-wr', 100, 5, atTenAm(thisMon)),
    ];

    const result = weeklyTrendPoints(sets, 3);
    expect(result[0]!.weekStart).toBe(twoWeeksAgo.toLocaleDateString('en-CA'));
    expect(result[0]!.sessions).toBe(1);
    expect(result[1]!.weekStart).toBe(oneWeekAgo.toLocaleDateString('en-CA'));
    expect(result[1]!.volumeKg).toBe(0);
    expect(result[1]!.sessions).toBe(0);
    expect(result[2]!.weekStart).toBe(thisMon.toLocaleDateString('en-CA'));
    expect(result[2]!.sessions).toBe(1);
  });

  it('returns all-zero points when no sets', () => {
    const result = weeklyTrendPoints([], 4);
    expect(result).toHaveLength(4);
    expect(result.every(p => p.volumeKg === 0 && p.sessions === 0)).toBe(true);
  });
});

// ── Overview ───────────────────────────────────────────────────────────────
describe('computeOverview', () => {
  it('computes current vs prior with deltas', () => {
    const current: WorkedSet[] = [
      wr('s1', 'ex-wr', 100, 5, new Date('2026-07-21')),
      wr('s2', 'ex-wr', 100, 5, new Date('2026-07-21')),
    ];
    const prior: WorkedSet[] = [
      wr('s3', 'ex-wr', 100, 5, new Date('2026-06-21')),
    ];

    const result = computeOverview(current, prior);
    expect(result.sessionsCurrent).toBe(2);
    expect(result.sessionsPrior).toBe(1);
    expect(result.sessionsDeltaPct).toBe(100);
    expect(result.setsCurrent).toBe(2);
    expect(result.setsPrior).toBe(1);
    expect(result.setsDeltaPct).toBe(100);
    expect(result.volumeCurrentKg).toBe(100 * 5 * 2);
    expect(result.volumePriorKg).toBe(100 * 5);
    expect(result.volumeDeltaPct).toBe(100);
  });

  it('null deltas when prior is empty', () => {
    const current: WorkedSet[] = [
      wr('s1', 'ex-wr', 100, 5, new Date('2026-07-21')),
    ];
    const result = computeOverview(current, []);
    expect(result.sessionsDeltaPct).toBeNull();
    expect(result.setsDeltaPct).toBeNull();
    expect(result.volumeDeltaPct).toBeNull();
  });

  it('zero values when both windows are empty', () => {
    const result = computeOverview([], []);
    expect(result.sessionsCurrent).toBe(0);
    expect(result.sessionsPrior).toBe(0);
    expect(result.sessionsDeltaPct).toBeNull();
    expect(result.volumeCurrentKg).toBe(0);
    expect(result.volumePriorKg).toBe(0);
    expect(result.volumeDeltaPct).toBeNull();
  });
});

// ── Exercise progress entries ─────────────────────────────────────────────
describe('exerciseProgressEntries', () => {
  it('computes weight-reps 1RM progression', () => {
    // Session A: 100kg x 5 → Epley 1RM = 116.67
    // Session B: 110kg x 5 → Epley 1RM = 128.33
    const sets: WorkedSet[] = [
      wr('sA', 'ex-wr', 100, 5, new Date('2026-06-01')),
      wr('sB', 'ex-wr', 110, 5, new Date('2026-07-01')),
    ];

    const result = exerciseProgressEntries(sets, [exWeight]);
    expect(result).toHaveLength(1);
    expect(result[0]!.trackingType).toBe('weight-reps');
    expect(result[0]!.deltaPct).toBeCloseTo(10, 1);
    expect(result[0]!.status).toBe('improving');
    expect(result[0]!.unitLabel).toBe('kg');
  });

  it('computes bodyweight-reps extra weight progression', () => {
    const sets: WorkedSet[] = [
      bw('sA', 'ex-bw', 8, 10, new Date('2026-06-01')),
      bw('sB', 'ex-bw', 8, 15, new Date('2026-07-01')),
    ];

    const result = exerciseProgressEntries(sets, [exBw]);
    expect(result[0]!.deltaPct).toBe(50);
    expect(result[0]!.status).toBe('improving');
  });

  it('computes time duration progression', () => {
    const sets: WorkedSet[] = [
      timeSet('sA', 'ex-time', 45, new Date('2026-06-01')),
      timeSet('sB', 'ex-time', 60, new Date('2026-07-01')),
    ];

    const result = exerciseProgressEntries(sets, [exTime]);
    expect(result[0]!.deltaPct).toBeCloseTo(33.33, 2);
    expect(result[0]!.status).toBe('improving');
    expect(result[0]!.unitLabel).toBe('sec');
  });

  it('computes distance-time pace progression', () => {
    // 5km in 1500s → 300 sec/km; 5km in 1400s → 280 sec/km
    const sets: WorkedSet[] = [
      distanceSet('sA', 'ex-dist', 5, 1500, new Date('2026-06-01')),
      distanceSet('sB', 'ex-dist', 5, 1400, new Date('2026-07-01')),
    ];

    const result = exerciseProgressEntries(sets, [exDistance]);
    expect(result[0]!.deltaPct).toBeCloseTo(6.67, 2);
    expect(result[0]!.status).toBe('improving');
    expect(result[0]!.unitLabel).toBe('sec/km');
  });

  it('omits exercises with only one workout', () => {
    const sets: WorkedSet[] = [
      wr('sA', 'ex-wr', 100, 5, new Date('2026-07-01')),
    ];
    expect(exerciseProgressEntries(sets, [exWeight])).toEqual([]);
  });

  it('returns empty array when no sets', () => {
    expect(exerciseProgressEntries([], [exWeight])).toEqual([]);
  });

  it('uses exerciseId as fallback name when exercise not found', () => {
    const sets: WorkedSet[] = [
      wr('sA', 'ex-missing', 100, 5, new Date('2026-06-01')),
      wr('sB', 'ex-missing', 105, 5, new Date('2026-07-01')),
    ];
    const result = exerciseProgressEntries(sets, []);
    expect(result[0]!.exerciseName).toBe('ex-missing');
  });

  it('sorts by absolute delta descending, nulls last', () => {
    const sets: WorkedSet[] = [
      wr('sA', 'ex-wr', 100, 5, new Date('2026-06-01')),
      wr('sB', 'ex-wr', 105, 5, new Date('2026-07-01')),
      bw('sA', 'ex-bw', 10, 10, new Date('2026-06-01')),
      bw('sB', 'ex-bw', 10, 11, new Date('2026-07-01')),
    ];
    const result = exerciseProgressEntries(sets, [exWeight, exBw]);
    expect(result).toHaveLength(2);
    expect(Math.abs(result[0]!.deltaPct!)).toBeGreaterThanOrEqual(Math.abs(result[1]!.deltaPct!));
  });
});
