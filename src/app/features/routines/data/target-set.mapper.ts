import {
  TargetSet,
  WeightRepsTarget,
  BodyweightRepsTarget,
  TimeTarget,
  DistanceTimeTarget,
} from '../domain/target-set';
import { assertNever } from '@core/shared/domain/tracking-type';

export interface TargetSetRow {
  type: string;
  reps?: number;
  weightKg?: number;
  extraWeightKg?: number;
  durationSec?: number;
  distanceKm?: number;
}

export function toTargetSet(row: TargetSetRow): TargetSet {
  switch (row.type) {
    case 'weight-reps':
      return {
        type: 'weight-reps',
        reps: row.reps ?? 0,
        weightKg: row.weightKg,
      } as WeightRepsTarget;
    case 'bodyweight-reps':
      return {
        type: 'bodyweight-reps',
        reps: row.reps ?? 0,
        extraWeightKg: row.extraWeightKg,
      } as BodyweightRepsTarget;
    case 'time':
      return {
        type: 'time',
        durationSec: row.durationSec ?? 0,
      } as TimeTarget;
    case 'distance-time':
      return {
        type: 'distance-time',
        distanceKm: row.distanceKm ?? 0,
        durationSec: row.durationSec ?? 0,
      } as DistanceTimeTarget;
    default:
      return assertNever(row.type as never);
  }
}

export function toTargetSetRow(target: TargetSet): TargetSetRow {
  switch (target.type) {
    case 'weight-reps':
      return { type: 'weight-reps', reps: target.reps, weightKg: target.weightKg };
    case 'bodyweight-reps':
      return { type: 'bodyweight-reps', reps: target.reps, extraWeightKg: target.extraWeightKg };
    case 'time':
      return { type: 'time', durationSec: target.durationSec };
    case 'distance-time':
      return { type: 'distance-time', distanceKm: target.distanceKm, durationSec: target.durationSec };
    default:
      return assertNever(target);
  }
}
