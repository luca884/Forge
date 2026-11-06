import { TestBed } from '@angular/core/testing';
import { ExerciseRecordsRebuilder } from './exercise-records-rebuilder';
import { PersonalRecordDetector } from './personal-record-detector';
import type { WorkedSet, WeightRepsSet, TimeSet } from '../worked-set';
import type { Reps } from '@core/shared/domain/value-objects/reps';
import type { Weight } from '@core/shared/domain/value-objects/weight';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 1, 18, minute));

function lift(id: string, minute: number, weight: number, reps: number, isPR = false): WeightRepsSet {
  return {
    id,
    sessionId: `s-${id}`,
    exerciseId: 'ex-1',
    type: 'weight-reps',
    isPR,
    createdAt: at(minute),
    reps: { value: reps } as Reps,
    weight: { value: weight } as Weight,
  };
}

function hold(id: string, minute: number): TimeSet {
  return { id, sessionId: 's-1', exerciseId: 'ex-2', type: 'time', isPR: false, createdAt: at(minute), durationSec: 60 };
}

describe('ExerciseRecordsRebuilder', () => {
  let rebuilder: ExerciseRecordsRebuilder;
  let n = 0;
  const newId = () => `pr-${++n}`;
  beforeEach(() => {
    n = 0;
    TestBed.configureTestingModule({ providers: [ExerciseRecordsRebuilder, PersonalRecordDetector] });
    rebuilder = TestBed.inject(ExerciseRecordsRebuilder);
  });

  const prFlags = (sets: readonly WorkedSet[]) => sets.map((s) => [s.id, s.isPR]);

  it('marks each set against the sets logged before it, oldest first, like logging them one by one', () => {
    const { sets, records } = rebuilder.rebuild([lift('a', 0, 60, 5), lift('b', 10, 70, 5), lift('c', 20, 65, 5)], newId);

    expect(prFlags(sets)).toEqual([['a', true], ['b', true], ['c', false]]);
    expect(records).toEqual([
      { id: 'pr-1', exerciseId: 'ex-1', trackingType: 'weight-reps', workedSetId: 'a', achievedAt: at(0), set: lift('a', 0, 60, 5, true) },
      { id: 'pr-2', exerciseId: 'ex-1', trackingType: 'weight-reps', workedSetId: 'b', achievedAt: at(10), set: lift('b', 10, 70, 5, true) },
    ]);
  });

  it('a corrected old set changes the records after it ("cargué 80 en vez de 60" the other way round)', () => {
    // The first set was really 80 kg: the later 70 kg is no longer a record.
    const { sets, records } = rebuilder.rebuild([lift('a', 0, 80, 5), lift('b', 10, 70, 5, true), lift('c', 20, 65, 5)], newId);

    expect(prFlags(sets)).toEqual([['a', true], ['b', false], ['c', false]]);
    expect(records.map((r) => r.workedSetId)).toEqual(['a']);
  });

  it('a removed record lets a later set become the record', () => {
    // Without the 80 kg set, the 70 kg set after it is now the best.
    const { sets } = rebuilder.rebuild([lift('b', 10, 70, 5), lift('c', 20, 65, 5)], newId);
    expect(prFlags(sets)).toEqual([['b', true], ['c', false]]);
  });

  it('does not depend on the order the sets come in', () => {
    const shuffled = rebuilder.rebuild([lift('c', 20, 65, 5), lift('a', 0, 60, 5), lift('b', 10, 70, 5)], newId);
    expect(prFlags(shuffled.sets)).toEqual([['a', true], ['b', true], ['c', false]]);
  });

  it('time sets never make records', () => {
    const { sets, records } = rebuilder.rebuild([hold('t1', 0), hold('t2', 5)], newId);
    expect(prFlags(sets)).toEqual([['t1', false], ['t2', false]]);
    expect(records).toEqual([]);
  });

  it('no sets, no records', () => {
    expect(rebuilder.rebuild([], newId)).toEqual({ sets: [], records: [] });
  });
});
