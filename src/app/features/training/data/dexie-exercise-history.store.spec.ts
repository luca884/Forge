import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import type { Reps } from '@core/shared/domain/value-objects/reps';
import type { Weight } from '@core/shared/domain/value-objects/weight';
import type { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { toPersonalRecordRow } from '@features/progress/data/mappers/personal-record.mapper';
import type { WeightRepsSet } from '../domain/worked-set';
import { DexieExerciseHistoryStore } from './dexie-exercise-history.store';
import { toWorkedSetRow } from './worked-set.mapper';

const at = new Date('2026-11-01T18:00:00Z');
const lift = (id: string, weight: number, isPR: boolean): WeightRepsSet => ({
  id, sessionId: 's1', exerciseId: 'ex-1', type: 'weight-reps', isPR, createdAt: at, reps: { value: 5 } as Reps, weight: { value: weight } as Weight,
});
const record = (id: string, set: WeightRepsSet): PersonalRecord => ({
  id, exerciseId: 'ex-1', trackingType: 'weight-reps', workedSetId: set.id, achievedAt: at, set,
});

describe('DexieExerciseHistoryStore', () => {
  let db: ForgeDatabaseService;
  let store: DexieExerciseHistoryStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [ForgeDatabaseService, DexieExerciseHistoryStore] });
    db = TestBed.inject(ForgeDatabaseService);
    store = TestBed.inject(DexieExerciseHistoryStore);
    await db.open();
    await db.workedSets.bulkAdd([lift('a', 60, true), lift('b', 70, true)].map(toWorkedSetRow));
    await db.personalRecords.bulkAdd([record('pr-a', lift('a', 60, true)), record('pr-b', lift('b', 70, true))].map(toPersonalRecordRow));
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  const snapshot = async () => ({ sets: await db.workedSets.toArray(), records: await db.personalRecords.toArray() });

  it('deletes, updates and replaces the records of the exercise in one go', async () => {
    const b = lift('b', 70, true);
    await store.rewrite({ exerciseId: 'ex-1', removedSetIds: ['a'], sets: [b], records: [record('pr-new', b)] });

    const { sets, records } = await snapshot();
    expect(sets.map((s) => s.id)).toEqual(['b']);
    expect(records.map((r) => [r.id, r.workedSetId])).toEqual([['pr-new', 'b']]);
  });

  it('is all or nothing: when a record cannot be written, sets and records stay as they were', async () => {
    const before = await snapshot();
    const b = lift('b', 70, false);
    // Two records with the same id: the second insert fails after the deletes already ran.
    await expect(
      store.rewrite({ exerciseId: 'ex-1', removedSetIds: ['a'], sets: [b], records: [record('dup', b), record('dup', b)] }),
    ).rejects.toThrow();

    expect(await snapshot()).toEqual(before);
  });
});
