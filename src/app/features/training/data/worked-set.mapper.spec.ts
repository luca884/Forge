import { toWorkedSet, toWorkedSetRow } from './worked-set.mapper';
import { WeightRepsSet, BodyweightRepsSet, TimeSet, DistanceTimeSet } from '../domain/worked-set';
import { WorkedSetRow } from '@core/db/database';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

function baseRow(overrides: Partial<WorkedSetRow> = {}): WorkedSetRow {
  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    isPR: false,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// V-23: all 4 variants covered

describe('worked-set.mapper', () => {

  describe('toWorkedSetRow + toWorkedSet (round-trip)', () => {
    it('should round-trip a WeightRepsSet correctly', () => {
      const set: WeightRepsSet = {
        id: 'set-1', sessionId: 'session-1', exerciseId: 'ex-1',
        isPR: true, createdAt: new Date('2024-01-01'),
        type: 'weight-reps',
        reps: new Reps(10),
        weight: new Weight(100),
      };

      const row = toWorkedSetRow(set);
      const result = toWorkedSet(row);

      expect(result.type).toBe('weight-reps');
      if (result.type === 'weight-reps') {
        expect(result.reps.value).toBe(10);
        expect(result.weight.value).toBe(100);
        expect(result.isPR).toBe(true);
      }
    });

    it('should round-trip a BodyweightRepsSet with extra weight', () => {
      const set: BodyweightRepsSet = {
        id: 'set-2', sessionId: 'session-1', exerciseId: 'ex-1',
        isPR: false, createdAt: new Date('2024-01-01'),
        type: 'bodyweight-reps',
        reps: new Reps(12),
        extraWeight: new Weight(10),
      };

      const row = toWorkedSetRow(set);
      const result = toWorkedSet(row);

      expect(result.type).toBe('bodyweight-reps');
      if (result.type === 'bodyweight-reps') {
        expect(result.reps.value).toBe(12);
        expect(result.extraWeight?.value).toBe(10);
      }
    });

    it('should round-trip a BodyweightRepsSet without extra weight', () => {
      const set: BodyweightRepsSet = {
        id: 'set-3', sessionId: 'session-1', exerciseId: 'ex-1',
        isPR: false, createdAt: new Date('2024-01-01'),
        type: 'bodyweight-reps',
        reps: new Reps(15),
        extraWeight: undefined,
      };

      const row = toWorkedSetRow(set);
      const result = toWorkedSet(row);

      expect(result.type).toBe('bodyweight-reps');
      if (result.type === 'bodyweight-reps') {
        expect(result.reps.value).toBe(15);
        expect(result.extraWeight).toBeUndefined();
      }
    });

    it('should round-trip a TimeSet correctly', () => {
      const set: TimeSet = {
        id: 'set-4', sessionId: 'session-1', exerciseId: 'ex-1',
        isPR: false, createdAt: new Date('2024-01-01'),
        type: 'time',
        durationSec: 60,
      };

      const row = toWorkedSetRow(set);
      const result = toWorkedSet(row);

      expect(result.type).toBe('time');
      if (result.type === 'time') {
        expect(result.durationSec).toBe(60);
      }
    });

    it('should round-trip a DistanceTimeSet correctly', () => {
      const set: DistanceTimeSet = {
        id: 'set-5', sessionId: 'session-1', exerciseId: 'ex-1',
        isPR: false, createdAt: new Date('2024-01-01'),
        type: 'distance-time',
        distanceKm: 5,
        durationSec: 1800,
      };

      const row = toWorkedSetRow(set);
      const result = toWorkedSet(row);

      expect(result.type).toBe('distance-time');
      if (result.type === 'distance-time') {
        expect(result.distanceKm).toBe(5);
        expect(result.durationSec).toBe(1800);
      }
    });
  });

  describe('toWorkedSet — error cases', () => {
    // D-25/S2: corrupt DB data throws
    it('should throw when weight-reps row has invalid reps (-1)', () => {
      const row = baseRow({ type: 'weight-reps', reps: -1, weightKg: 100 });
      expect(() => toWorkedSet(row)).toThrow();
    });

    it('should throw when weight-reps row has invalid weight (0)', () => {
      const row = baseRow({ type: 'weight-reps', reps: 10, weightKg: 0 });
      expect(() => toWorkedSet(row)).toThrow();
    });
  });

  describe('toWorkedSetRow', () => {
    it('should store reps as number (unwrapped from VO)', () => {
      const set: WeightRepsSet = {
        id: 'set-1', sessionId: 's', exerciseId: 'e',
        isPR: false, createdAt: new Date(),
        type: 'weight-reps', reps: new Reps(8), weight: new Weight(75),
      };
      const row = toWorkedSetRow(set);
      expect(typeof row['reps']).toBe('number');
      expect(row['reps']).toBe(8);
    });

    it('should store weightKg as number (unwrapped from VO)', () => {
      const set: WeightRepsSet = {
        id: 'set-1', sessionId: 's', exerciseId: 'e',
        isPR: false, createdAt: new Date(),
        type: 'weight-reps', reps: new Reps(8), weight: new Weight(75),
      };
      const row = toWorkedSetRow(set);
      expect(row['weightKg']).toBe(75);
    });
  });
});
