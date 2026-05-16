import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import type { WorkedSet, WeightRepsSet } from '@features/training/domain/worked-set';
import { buildTimeSeries } from './time-series';

// Helpers to build WorkedSet stubs
function weightRepsSet(overrides: Partial<WeightRepsSet> = {}): WeightRepsSet {
  return {
    id: 'ws-1',
    sessionId: 's-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: 5 } as any,
    weight: { value: 100 } as any,
    isPR: false,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const t1 = new Date('2026-01-01');
const t2 = new Date('2026-01-08');
const t3 = new Date('2026-01-15');

describe('buildTimeSeries', () => {
  describe('metric: weight', () => {
    it('returns one point per set with y = weight.value', () => {
      const sets: WorkedSet[] = [
        weightRepsSet({ createdAt: t1, weight: { value: 80 } as any }),
        weightRepsSet({ createdAt: t2, weight: { value: 85 } as any }),
      ];
      const [first] = buildTimeSeries(sets, 'weight-reps', 'weight');
      expect(first).toBeDefined();
      expect(first!.points).toHaveLength(2);
      expect(first!.points[0]).toEqual({ x: t1, y: 80 });
      expect(first!.points[1]).toEqual({ x: t2, y: 85 });
    });

    it('returns empty series for empty sets', () => {
      const [first] = buildTimeSeries([], 'weight-reps', 'weight');
      expect(first).toBeDefined();
      expect(first!.points).toHaveLength(0);
    });

    it('returns empty series for incompatible tracking type (time exercise, weight metric)', () => {
      const sets: WorkedSet[] = [
        {
          id: 'ws-2',
          sessionId: 's-1',
          exerciseId: 'ex-2',
          type: 'time',
          durationSec: 60,
          isPR: false,
          createdAt: t1,
        },
      ];
      const [first] = buildTimeSeries(sets, 'time', 'weight');
      expect(first!.points).toHaveLength(0);
    });
  });

  describe('metric: reps', () => {
    it('returns one point per set with y = reps.value', () => {
      const sets: WorkedSet[] = [
        weightRepsSet({ createdAt: t1, reps: { value: 5 } as any }),
        weightRepsSet({ createdAt: t2, reps: { value: 8 } as any }),
        weightRepsSet({ createdAt: t3, reps: { value: 10 } as any }),
      ];
      const [first] = buildTimeSeries(sets, 'weight-reps', 'reps');
      expect(first!.points[0]!.y).toBe(5);
      expect(first!.points[1]!.y).toBe(8);
      expect(first!.points[2]!.y).toBe(10);
    });
  });

  describe('metric: volume', () => {
    it('computes volume = weight.value * reps.value', () => {
      const sets: WorkedSet[] = [
        weightRepsSet({ createdAt: t1, weight: { value: 100 } as any, reps: { value: 5 } as any }),
        weightRepsSet({ createdAt: t2, weight: { value: 80 } as any, reps: { value: 8 } as any }),
      ];
      const [first] = buildTimeSeries(sets, 'weight-reps', 'volume');
      expect(first!.points[0]!.y).toBe(500);
      expect(first!.points[1]!.y).toBe(640);
    });
  });

  describe('metric: 1rm', () => {
    it('computes Epley 1RM for each set', () => {
      const sets: WorkedSet[] = [
        weightRepsSet({ createdAt: t1, weight: { value: 100 } as any, reps: { value: 5 } as any }),
      ];
      const [first] = buildTimeSeries(sets, 'weight-reps', '1rm');
      const expected = OneRepMax.epley(100, 5).kg;
      expect(first!.points[0]!.y).toBe(expected);
    });

    it('skips sets with reps=1 from denominator but still computes epley (reps=1 returns weightKg)', () => {
      const sets: WorkedSet[] = [
        weightRepsSet({ createdAt: t1, weight: { value: 100 } as any, reps: { value: 1 } as any }),
      ];
      const [first] = buildTimeSeries(sets, 'weight-reps', '1rm');
      // OneRepMax.epley(100, 1) = 100
      expect(first!.points[0]!.y).toBe(100);
    });
  });

  describe('series label', () => {
    it('uses a descriptive label per metric', () => {
      const sets: WorkedSet[] = [weightRepsSet()];
      expect(buildTimeSeries(sets, 'weight-reps', 'weight')[0]!.label).toBeTruthy();
      expect(buildTimeSeries(sets, 'weight-reps', 'reps')[0]!.label).toBeTruthy();
      expect(buildTimeSeries(sets, 'weight-reps', 'volume')[0]!.label).toBeTruthy();
      expect(buildTimeSeries(sets, 'weight-reps', '1rm')[0]!.label).toBeTruthy();
    });
  });
});
