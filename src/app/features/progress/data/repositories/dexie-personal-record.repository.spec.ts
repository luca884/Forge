/**
 * dexie-personal-record.repository.spec.ts
 * TDD strict — RED written before implementation.
 * Uses fake-indexeddb (registered globally in setup-jest.ts). D-10, D-12.
 * NO jest.mock of Dexie internals. D-10/R6.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { WeightRepsSet, BodyweightRepsSet, TimeSet } from '@features/training/domain/worked-set';
import { DexiePersonalRecordRepository } from './dexie-personal-record.repository';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeWeightRepsSet(id = 'set-1', weightKg = 80, reps = 5): WeightRepsSet {
  return {
    id,
    sessionId: 'session-1',
    exerciseId: 'ex-1',
    isPR: true,
    createdAt: new Date('2024-01-15T10:00:00'),
    type: 'weight-reps',
    reps: new Reps(reps),
    weight: new Weight(weightKg),
  };
}

function makePersonalRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  return {
    id: 'pr-1',
    exerciseId: 'ex-1',
    trackingType: 'weight-reps',
    workedSetId: 'set-1',
    achievedAt: new Date('2024-01-15T10:00:00'),
    set: makeWeightRepsSet(),
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('DexiePersonalRecordRepository', () => {
  let repo: PersonalRecordRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    db = new ForgeDatabaseService();
    TestBed.configureTestingModule({
      providers: [
        DexiePersonalRecordRepository,
        { provide: PersonalRecordRepository, useClass: DexiePersonalRecordRepository },
        { provide: ForgeDatabaseService, useValue: db },
      ],
    });
    repo = TestBed.inject(DexiePersonalRecordRepository);
    await db.personalRecords.clear();
  });

  afterEach(() => {
    db.close();
  });

  // D-10/S1: save creates a row
  it('should save a PersonalRecord and return it via listAll', async () => {
    const record = makePersonalRecord();
    await repo.save(record);

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe('pr-1');
    expect(all[0]!.trackingType).toBe('weight-reps');
  });

  // D-10/S2 + V-55: two saves same exerciseId → listAll returns 2 (append-only)
  it('should append two records for the same exerciseId (no overwrite)', async () => {
    const record1 = makePersonalRecord({ id: 'pr-1', set: makeWeightRepsSet('set-1', 80) });
    const record2 = makePersonalRecord({ id: 'pr-2', workedSetId: 'set-2', set: makeWeightRepsSet('set-2', 85) });

    await repo.save(record1);
    await repo.save(record2);

    const all = await repo.listAll('ex-1');
    expect(all).toHaveLength(2);
  });

  // D-10/S3: getById nonexistent → null
  it('should return null for getById with nonexistent id', async () => {
    const result = await repo.getById('nonexistent');
    expect(result).toBeNull();
  });

  it('should return a record by id', async () => {
    await repo.save(makePersonalRecord());
    const result = await repo.getById('pr-1');
    expect(result).not.toBeNull();
    expect(result!.exerciseId).toBe('ex-1');
  });

  // D-10/S4: getCurrentForExercise returns highest metric row
  it('should return the 85kg record as getCurrentForExercise for weight-reps', async () => {
    const record80 = makePersonalRecord({
      id: 'pr-80',
      workedSetId: 'set-80',
      achievedAt: new Date('2024-01-10'),
      set: makeWeightRepsSet('set-80', 80, 5),
    });
    const record85 = makePersonalRecord({
      id: 'pr-85',
      workedSetId: 'set-85',
      achievedAt: new Date('2024-01-15'),
      set: makeWeightRepsSet('set-85', 85, 3),
    });

    await repo.save(record80);
    await repo.save(record85);

    const current = await repo.getCurrentForExercise('ex-1', 'weight-reps');
    expect(current).not.toBeNull();
    expect(current!.id).toBe('pr-85');
    if (current!.set.type === 'weight-reps') {
      expect(current!.set.weight.value).toBe(85);
    }
  });

  it('should return null for getCurrentForExercise when no records exist', async () => {
    const result = await repo.getCurrentForExercise('ex-1', 'weight-reps');
    expect(result).toBeNull();
  });

  // bodyweight-reps: MAX by reps
  it('should return the record with more reps for bodyweight-reps', async () => {
    const lowReps: BodyweightRepsSet = {
      id: 'set-bw-10', sessionId: 's1', exerciseId: 'ex-bw',
      isPR: true, createdAt: new Date('2024-01-10'),
      type: 'bodyweight-reps', reps: new Reps(10),
    };
    const highReps: BodyweightRepsSet = {
      id: 'set-bw-20', sessionId: 's1', exerciseId: 'ex-bw',
      isPR: true, createdAt: new Date('2024-01-15'),
      type: 'bodyweight-reps', reps: new Reps(20),
    };

    await repo.save({ id: 'pr-bw-10', exerciseId: 'ex-bw', trackingType: 'bodyweight-reps', workedSetId: 'set-bw-10', achievedAt: new Date('2024-01-10'), set: lowReps });
    await repo.save({ id: 'pr-bw-20', exerciseId: 'ex-bw', trackingType: 'bodyweight-reps', workedSetId: 'set-bw-20', achievedAt: new Date('2024-01-15'), set: highReps });

    const current = await repo.getCurrentForExercise('ex-bw', 'bodyweight-reps');
    expect(current).not.toBeNull();
    expect(current!.id).toBe('pr-bw-20');
  });

  // time: MIN by durationSec (shorter time = better)
  it('should return the record with shorter durationSec for time trackingType', async () => {
    const slowSet: TimeSet = {
      id: 'set-t-slow', sessionId: 's1', exerciseId: 'ex-t',
      isPR: true, createdAt: new Date('2024-01-10'),
      type: 'time', durationSec: 600,
    };
    const fastSet: TimeSet = {
      id: 'set-t-fast', sessionId: 's1', exerciseId: 'ex-t',
      isPR: true, createdAt: new Date('2024-01-15'),
      type: 'time', durationSec: 300,
    };

    await repo.save({ id: 'pr-t-slow', exerciseId: 'ex-t', trackingType: 'time', workedSetId: 'set-t-slow', achievedAt: new Date('2024-01-10'), set: slowSet });
    await repo.save({ id: 'pr-t-fast', exerciseId: 'ex-t', trackingType: 'time', workedSetId: 'set-t-fast', achievedAt: new Date('2024-01-15'), set: fastSet });

    const current = await repo.getCurrentForExercise('ex-t', 'time');
    expect(current).not.toBeNull();
    expect(current!.id).toBe('pr-t-fast');
  });

  // listAll ordered by achievedAt DESC
  it('should return listAll ordered by achievedAt descending', async () => {
    const older = makePersonalRecord({ id: 'pr-old', workedSetId: 'set-old', achievedAt: new Date('2024-01-01') });
    const newer = makePersonalRecord({ id: 'pr-new', workedSetId: 'set-new', achievedAt: new Date('2024-06-01') });

    await repo.save(older);
    await repo.save(newer);

    const all = await repo.listAll();
    expect(all[0]!.id).toBe('pr-new');
    expect(all[1]!.id).toBe('pr-old');
  });

  // listAll filtered by exerciseId
  it('should filter listAll by exerciseId', async () => {
    const recordEx1 = makePersonalRecord({ id: 'pr-ex1', exerciseId: 'ex-1', workedSetId: 'set-ex1', set: makeWeightRepsSet('set-ex1') });
    const recordEx2: PersonalRecord = {
      id: 'pr-ex2',
      exerciseId: 'ex-2',
      trackingType: 'weight-reps',
      workedSetId: 'set-ex2',
      achievedAt: new Date(),
      set: { ...makeWeightRepsSet('set-ex2'), exerciseId: 'ex-2' },
    };

    await repo.save(recordEx1);
    await repo.save(recordEx2);

    const forEx1 = await repo.listAll('ex-1');
    expect(forEx1).toHaveLength(1);
    expect(forEx1[0]!.exerciseId).toBe('ex-1');
  });
});
