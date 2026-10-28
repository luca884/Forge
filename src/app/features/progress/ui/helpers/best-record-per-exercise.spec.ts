import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { bestRecordPerExercise } from './best-record-per-exercise';

function record(id: string, exerciseId: string, weight: number, reps: number, achievedAt: string): PersonalRecord {
  const set: WorkedSet = {
    id: `ws-${id}`,
    sessionId: 's-1',
    exerciseId,
    type: 'weight-reps',
    reps: { value: reps } as any,
    weight: { value: weight } as any,
    isPR: true,
    createdAt: new Date(achievedAt),
  };
  return {
    id,
    exerciseId,
    trackingType: 'weight-reps',
    workedSetId: set.id,
    achievedAt: new Date(achievedAt),
    set,
  };
}

describe('bestRecordPerExercise', () => {
  it('keeps one row per exercise, with its best mark (heaviest, then more reps)', () => {
    const rows = bestRecordPerExercise([
      record('a', 'ex-1', 80, 5, '2026-03-01'),
      record('b', 'ex-1', 100, 3, '2026-02-01'),
      record('c', 'ex-1', 100, 5, '2026-01-01'),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['c']);
  });

  it('breaks a perfect tie with the most recent record', () => {
    const rows = bestRecordPerExercise([
      record('old', 'ex-1', 100, 5, '2026-01-01'),
      record('new', 'ex-1', 100, 5, '2026-02-01'),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['new']);
  });

  it('orders the rows by the most recent record of each exercise, newest first', () => {
    const rows = bestRecordPerExercise([
      record('squat-pr', 'squat', 120, 5, '2026-03-01'),
      record('bench-old', 'bench', 90, 5, '2026-01-10'),
      record('bench-new', 'bench', 95, 5, '2026-03-15'),
      record('row-pr', 'row', 70, 8, '2026-02-01'),
    ]);
    expect(rows.map((r) => r.exerciseId)).toEqual(['bench', 'squat', 'row']);
  });

  it('is empty without records and does not change its input', () => {
    expect(bestRecordPerExercise([])).toEqual([]);
    const input = [record('a', 'ex-1', 80, 5, '2026-03-01'), record('b', 'ex-2', 60, 5, '2026-03-02')];
    const copy = [...input];
    bestRecordPerExercise(input);
    expect(input).toEqual(copy);
  });
});
