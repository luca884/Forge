import type { WorkedSet } from '@features/training/domain/worked-set';
import { bestSetOf, compareBestSet, maxRepsOf } from './best-set';

function weightReps(id: string, weight: number, reps: number): WorkedSet {
  return {
    id,
    sessionId: 's-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: reps } as any,
    weight: { value: weight } as any,
    isPR: false,
    createdAt: new Date('2026-01-01'),
  };
}

function bodyweight(id: string, reps: number, extraKg?: number): WorkedSet {
  return {
    id,
    sessionId: 's-1',
    exerciseId: 'ex-2',
    type: 'bodyweight-reps',
    reps: { value: reps } as any,
    ...(extraKg === undefined ? {} : { extraWeight: { value: extraKg } as any }),
    isPR: false,
    createdAt: new Date('2026-01-01'),
  };
}

const plank: WorkedSet = {
  id: 'ws-time',
  sessionId: 's-1',
  exerciseId: 'ex-3',
  type: 'time',
  durationSec: 60,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

describe('bestSetOf', () => {
  it('picks the set with the most weight', () => {
    const best = bestSetOf([weightReps('a', 80, 8), weightReps('b', 100, 3), weightReps('c', 90, 5)]);
    expect(best?.id).toBe('b');
  });

  it('breaks a tie on weight with the set that has more reps', () => {
    const best = bestSetOf([weightReps('a', 80, 8), weightReps('b', 80, 10), weightReps('c', 80, 9)]);
    expect(best?.id).toBe('b');
  });

  it('does not depend on the order of the sets', () => {
    const sets = [weightReps('a', 80, 8), weightReps('b', 80, 10), weightReps('c', 70, 12)];
    expect(bestSetOf([...sets].reverse())?.id).toBe('b');
  });

  it('ranks bodyweight sets by extra weight (none counts as zero) and then by reps', () => {
    expect(bestSetOf([bodyweight('a', 12), bodyweight('b', 9)])?.id).toBe('a');
    expect(bestSetOf([bodyweight('a', 12), bodyweight('b', 5, 10)])?.id).toBe('b');
  });

  it('returns null without sets or when no set has reps (time, distance-time)', () => {
    expect(bestSetOf([])).toBeNull();
    expect(bestSetOf([plank])).toBeNull();
  });
});

describe('compareBestSet', () => {
  it('is positive when the first set is better, negative when it is worse, zero when equal', () => {
    expect(compareBestSet(weightReps('a', 100, 5), weightReps('b', 90, 8))).toBeGreaterThan(0);
    expect(compareBestSet(weightReps('a', 90, 5), weightReps('b', 90, 8))).toBeLessThan(0);
    expect(compareBestSet(weightReps('a', 90, 8), weightReps('b', 90, 8))).toBe(0);
  });

  it('ranks any set with reps above a set without them', () => {
    expect(compareBestSet(weightReps('a', 10, 1), plank)).toBeGreaterThan(0);
    expect(compareBestSet(plank, weightReps('a', 10, 1))).toBeLessThan(0);
  });
});

describe('maxRepsOf', () => {
  it('is the highest rep count of any set, whatever its weight', () => {
    expect(maxRepsOf([weightReps('a', 100, 3), weightReps('b', 60, 15), weightReps('c', 80, 8)])).toBe(15);
  });

  it('counts bodyweight sets too', () => {
    expect(maxRepsOf([bodyweight('a', 12), bodyweight('b', 9, 10)])).toBe(12);
  });

  it('is null without sets or when no set has reps', () => {
    expect(maxRepsOf([])).toBeNull();
    expect(maxRepsOf([plank])).toBeNull();
  });
});
