/**
 * personal-record.mapper.spec.ts
 * TDD strict — RED written before implementation. D-11, D-12.
 */
import { PersonalRecordRow } from '@core/db/database';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import {
  WeightRepsSet,
  BodyweightRepsSet,
  TimeSet,
} from '@features/training/domain/worked-set';
import { toPersonalRecord, toPersonalRecordRow } from './personal-record.mapper';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeWeightRepsRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  const set: WeightRepsSet = {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'ex-1',
    isPR: true,
    createdAt: new Date('2024-01-15T10:00:00'),
    type: 'weight-reps',
    reps: new Reps(5),
    weight: new Weight(100),
  };
  return {
    id: 'pr-1',
    exerciseId: 'ex-1',
    trackingType: 'weight-reps',
    workedSetId: 'set-1',
    achievedAt: new Date('2024-01-15T10:00:00'),
    set,
    ...overrides,
  };
}

function makeBodyweightRepsRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  const set: BodyweightRepsSet = {
    id: 'set-2',
    sessionId: 'session-1',
    exerciseId: 'ex-2',
    isPR: true,
    createdAt: new Date('2024-01-15T11:00:00'),
    type: 'bodyweight-reps',
    reps: new Reps(12),
    extraWeight: new Weight(20),
  };
  return {
    id: 'pr-2',
    exerciseId: 'ex-2',
    trackingType: 'bodyweight-reps',
    workedSetId: 'set-2',
    achievedAt: new Date('2024-01-15T11:00:00'),
    set,
    ...overrides,
  };
}

function makeWeightRepsRow(overrides: Partial<PersonalRecordRow> = {}): PersonalRecordRow {
  return {
    id: 'pr-1',
    exerciseId: 'ex-1',
    trackingType: 'weight-reps',
    workedSetId: 'set-1',
    achievedAt: new Date('2024-01-15T10:00:00'),
    reps: 5,
    weightKg: 100,
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('personal-record.mapper', () => {
  // D-11/S1: round-trip weight-reps
  describe('toPersonalRecordRow → toPersonalRecord (weight-reps round-trip)', () => {
    it('should produce the same entity after round-trip', () => {
      const original = makeWeightRepsRecord();
      const row = toPersonalRecordRow(original);
      const result = toPersonalRecord(row);

      expect(result.id).toBe(original.id);
      expect(result.exerciseId).toBe(original.exerciseId);
      expect(result.trackingType).toBe(original.trackingType);
      expect(result.workedSetId).toBe(original.workedSetId);
      expect(result.achievedAt.getTime()).toBe(original.achievedAt.getTime());
      expect(result.set.type).toBe('weight-reps');
      if (result.set.type === 'weight-reps') {
        expect(result.set.reps.value).toBe(5);
        expect(result.set.weight.value).toBe(100);
      }
    });
  });

  // D-11/S1: round-trip bodyweight-reps
  describe('toPersonalRecordRow → toPersonalRecord (bodyweight-reps round-trip)', () => {
    it('should preserve bodyweight-reps with extraWeight', () => {
      const original = makeBodyweightRepsRecord();
      const row = toPersonalRecordRow(original);
      const result = toPersonalRecord(row);

      expect(result.trackingType).toBe('bodyweight-reps');
      expect(result.set.type).toBe('bodyweight-reps');
      if (result.set.type === 'bodyweight-reps') {
        expect(result.set.reps.value).toBe(12);
        expect(result.set.extraWeight?.value).toBe(20);
      }
    });

    it('should handle bodyweight-reps without extraWeight', () => {
      const set: BodyweightRepsSet = {
        id: 'set-bw', sessionId: 'session-1', exerciseId: 'ex-2',
        isPR: true, createdAt: new Date(),
        type: 'bodyweight-reps', reps: new Reps(15),
      };
      const record: PersonalRecord = {
        id: 'pr-bw', exerciseId: 'ex-2', trackingType: 'bodyweight-reps',
        workedSetId: 'set-bw', achievedAt: new Date(), set,
      };
      const row = toPersonalRecordRow(record);
      const result = toPersonalRecord(row);
      if (result.set.type === 'bodyweight-reps') {
        expect(result.set.extraWeight).toBeUndefined();
      }
    });
  });

  // D-11/S2: toPersonalRecord with trackingType 'weight-reps' produces WeightRepsSet
  describe('toPersonalRecord from row', () => {
    it('should produce a WeightRepsSet for weight-reps row', () => {
      const row = makeWeightRepsRow();
      const record = toPersonalRecord(row);

      expect(record.set.type).toBe('weight-reps');
      if (record.set.type === 'weight-reps') {
        expect(record.set.weight.value).toBe(100);
        expect(record.set.reps.value).toBe(5);
      }
    });

    // time variant round-trip via row → entity
    it('should produce a TimeSet for time row', () => {
      const timeRow: PersonalRecordRow = {
        id: 'pr-t', exerciseId: 'ex-t', trackingType: 'time',
        workedSetId: 'set-t', achievedAt: new Date(),
        durationSec: 300,
        createdAt: new Date(), updatedAt: new Date(),
      };
      const record = toPersonalRecord(timeRow);
      expect(record.set.type).toBe('time');
      if (record.set.type === 'time') {
        expect(record.set.durationSec).toBe(300);
      }
    });

    // assertNever coverage — distance-time (comment: exhaustive switch required)
    it('should produce a DistanceTimeSet for distance-time row', () => {
      const dtRow: PersonalRecordRow = {
        id: 'pr-dt', exerciseId: 'ex-dt', trackingType: 'distance-time',
        workedSetId: 'set-dt', achievedAt: new Date(),
        distanceKm: 5, durationSec: 1800,
        createdAt: new Date(), updatedAt: new Date(),
      };
      const record = toPersonalRecord(dtRow);
      expect(record.set.type).toBe('distance-time');
    });
  });

  // toPersonalRecordRow stores all required fields
  describe('toPersonalRecordRow', () => {
    it('should store exerciseId, workedSetId, trackingType in row', () => {
      const record = makeWeightRepsRecord();
      const row = toPersonalRecordRow(record);

      expect(row.exerciseId).toBe('ex-1');
      expect(row.workedSetId).toBe('set-1');
      expect(row.trackingType).toBe('weight-reps');
      expect(row.reps).toBe(5);
      expect(row.weightKg).toBe(100);
    });

    it('should store durationSec for time set', () => {
      const set: TimeSet = {
        id: 'set-t', sessionId: 'session-1', exerciseId: 'ex-t',
        isPR: true, createdAt: new Date(),
        type: 'time', durationSec: 600,
      };
      const record: PersonalRecord = {
        id: 'pr-t', exerciseId: 'ex-t', trackingType: 'time',
        workedSetId: 'set-t', achievedAt: new Date(), set,
      };
      const row = toPersonalRecordRow(record);
      expect(row.durationSec).toBe(600);
      expect(row.trackingType).toBe('time');
    });
  });
});
