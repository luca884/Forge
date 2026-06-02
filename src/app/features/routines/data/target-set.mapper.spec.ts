import { toTargetSet, toTargetSetRow, TargetSetRow } from './target-set.mapper';
import {
  WeightRepsTarget,
  BodyweightRepsTarget,
  TimeTarget,
  DistanceTimeTarget,
} from '../domain/target-set';

describe('target-set.mapper', () => {

  // ─── toTargetSet ────────────────────────────────────────────────────────────

  describe('toTargetSet', () => {

    it('should map a weight-reps row with all fields', () => {
      const row: TargetSetRow = { type: 'weight-reps', reps: 8, weightKg: 100 };
      const result = toTargetSet(row) as WeightRepsTarget;

      expect(result.type).toBe('weight-reps');
      expect(result.reps).toBe(8);
      expect(result.weightKg).toBe(100);
    });

    it('should map a weight-reps row with weightKg undefined', () => {
      const row: TargetSetRow = { type: 'weight-reps', reps: 5 };
      const result = toTargetSet(row) as WeightRepsTarget;

      expect(result.type).toBe('weight-reps');
      expect(result.reps).toBe(5);
      expect(result.weightKg).toBeUndefined();
    });

    it('should default reps to 0 when weight-reps row has reps undefined', () => {
      const row: TargetSetRow = { type: 'weight-reps', weightKg: 80 };
      const result = toTargetSet(row) as WeightRepsTarget;

      expect(result.reps).toBe(0);
    });

    it('should map a bodyweight-reps row with extraWeightKg', () => {
      const row: TargetSetRow = { type: 'bodyweight-reps', reps: 12, extraWeightKg: 10 };
      const result = toTargetSet(row) as BodyweightRepsTarget;

      expect(result.type).toBe('bodyweight-reps');
      expect(result.reps).toBe(12);
      expect(result.extraWeightKg).toBe(10);
    });

    it('should map a bodyweight-reps row with extraWeightKg undefined', () => {
      const row: TargetSetRow = { type: 'bodyweight-reps', reps: 15 };
      const result = toTargetSet(row) as BodyweightRepsTarget;

      expect(result.type).toBe('bodyweight-reps');
      expect(result.reps).toBe(15);
      expect(result.extraWeightKg).toBeUndefined();
    });

    it('should default reps to 0 when bodyweight-reps row has reps undefined', () => {
      const row: TargetSetRow = { type: 'bodyweight-reps' };
      const result = toTargetSet(row) as BodyweightRepsTarget;

      expect(result.reps).toBe(0);
    });

    it('should map a time row', () => {
      const row: TargetSetRow = { type: 'time', durationSec: 60 };
      const result = toTargetSet(row) as TimeTarget;

      expect(result.type).toBe('time');
      expect(result.durationSec).toBe(60);
    });

    it('should default durationSec to 0 when time row has durationSec undefined', () => {
      const row: TargetSetRow = { type: 'time' };
      const result = toTargetSet(row) as TimeTarget;

      expect(result.durationSec).toBe(0);
    });

    it('should map a distance-time row', () => {
      const row: TargetSetRow = { type: 'distance-time', distanceKm: 5, durationSec: 1800 };
      const result = toTargetSet(row) as DistanceTimeTarget;

      expect(result.type).toBe('distance-time');
      expect(result.distanceKm).toBe(5);
      expect(result.durationSec).toBe(1800);
    });

    it('should default distanceKm to 0 when distance-time row has distanceKm undefined', () => {
      const row: TargetSetRow = { type: 'distance-time', durationSec: 900 };
      const result = toTargetSet(row) as DistanceTimeTarget;

      expect(result.distanceKm).toBe(0);
    });

    it('should default durationSec to 0 when distance-time row has durationSec undefined', () => {
      const row: TargetSetRow = { type: 'distance-time', distanceKm: 3 };
      const result = toTargetSet(row) as DistanceTimeTarget;

      expect(result.durationSec).toBe(0);
    });

    it('should throw via assertNever for an unknown type', () => {
      const row = { type: 'unknown-type' } as unknown as TargetSetRow;
      expect(() => toTargetSet(row)).toThrow();
    });
  });

  // ─── toTargetSetRow ─────────────────────────────────────────────────────────

  describe('toTargetSetRow', () => {

    it('should serialize a WeightRepsTarget with weightKg', () => {
      const target: WeightRepsTarget = { type: 'weight-reps', reps: 10, weightKg: 80 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('weight-reps');
      expect(row.reps).toBe(10);
      expect(row.weightKg).toBe(80);
    });

    it('should serialize a WeightRepsTarget with weightKg undefined', () => {
      const target: WeightRepsTarget = { type: 'weight-reps', reps: 10 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('weight-reps');
      expect(row.reps).toBe(10);
      expect(row.weightKg).toBeUndefined();
    });

    it('should serialize a BodyweightRepsTarget with extraWeightKg', () => {
      const target: BodyweightRepsTarget = { type: 'bodyweight-reps', reps: 15, extraWeightKg: 5 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('bodyweight-reps');
      expect(row.reps).toBe(15);
      expect(row.extraWeightKg).toBe(5);
    });

    it('should serialize a BodyweightRepsTarget with extraWeightKg undefined', () => {
      const target: BodyweightRepsTarget = { type: 'bodyweight-reps', reps: 20 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('bodyweight-reps');
      expect(row.reps).toBe(20);
      expect(row.extraWeightKg).toBeUndefined();
    });

    it('should serialize a TimeTarget', () => {
      const target: TimeTarget = { type: 'time', durationSec: 90 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('time');
      expect(row.durationSec).toBe(90);
    });

    it('should serialize a DistanceTimeTarget', () => {
      const target: DistanceTimeTarget = { type: 'distance-time', distanceKm: 10, durationSec: 3600 };
      const row = toTargetSetRow(target);

      expect(row.type).toBe('distance-time');
      expect(row.distanceKm).toBe(10);
      expect(row.durationSec).toBe(3600);
    });
  });

  // ─── Round-trip ─────────────────────────────────────────────────────────────

  describe('round-trip (toTargetSetRow → toTargetSet)', () => {

    it('should round-trip a WeightRepsTarget with weightKg', () => {
      const target: WeightRepsTarget = { type: 'weight-reps', reps: 8, weightKg: 100 };
      const result = toTargetSet(toTargetSetRow(target)) as WeightRepsTarget;

      expect(result.type).toBe('weight-reps');
      expect(result.reps).toBe(8);
      expect(result.weightKg).toBe(100);
    });

    it('should round-trip a WeightRepsTarget without weightKg', () => {
      const target: WeightRepsTarget = { type: 'weight-reps', reps: 5 };
      const result = toTargetSet(toTargetSetRow(target)) as WeightRepsTarget;

      expect(result.type).toBe('weight-reps');
      expect(result.reps).toBe(5);
      expect(result.weightKg).toBeUndefined();
    });

    it('should round-trip a BodyweightRepsTarget with extraWeightKg', () => {
      const target: BodyweightRepsTarget = { type: 'bodyweight-reps', reps: 12, extraWeightKg: 10 };
      const result = toTargetSet(toTargetSetRow(target)) as BodyweightRepsTarget;

      expect(result.type).toBe('bodyweight-reps');
      expect(result.reps).toBe(12);
      expect(result.extraWeightKg).toBe(10);
    });

    it('should round-trip a BodyweightRepsTarget without extraWeightKg', () => {
      const target: BodyweightRepsTarget = { type: 'bodyweight-reps', reps: 15 };
      const result = toTargetSet(toTargetSetRow(target)) as BodyweightRepsTarget;

      expect(result.type).toBe('bodyweight-reps');
      expect(result.reps).toBe(15);
      expect(result.extraWeightKg).toBeUndefined();
    });

    it('should round-trip a TimeTarget', () => {
      const target: TimeTarget = { type: 'time', durationSec: 60 };
      const result = toTargetSet(toTargetSetRow(target)) as TimeTarget;

      expect(result.type).toBe('time');
      expect(result.durationSec).toBe(60);
    });

    it('should round-trip a DistanceTimeTarget', () => {
      const target: DistanceTimeTarget = { type: 'distance-time', distanceKm: 5, durationSec: 1800 };
      const result = toTargetSet(toTargetSetRow(target)) as DistanceTimeTarget;

      expect(result.type).toBe('distance-time');
      expect(result.distanceKm).toBe(5);
      expect(result.durationSec).toBe(1800);
    });
  });
});
