import { assertNever } from '@core/shared/domain/tracking-type';

export interface WeightRepsTarget {
  readonly type: 'weight-reps';
  readonly reps: number;
  readonly weightKg?: number;
}

export interface BodyweightRepsTarget {
  readonly type: 'bodyweight-reps';
  readonly reps: number;
  readonly extraWeightKg?: number;
}

export interface TimeTarget {
  readonly type: 'time';
  readonly durationSec: number;
}

export interface DistanceTimeTarget {
  readonly type: 'distance-time';
  readonly distanceKm: number;
  readonly durationSec: number;
}

export type TargetSet =
  | WeightRepsTarget
  | BodyweightRepsTarget
  | TimeTarget
  | DistanceTimeTarget;

/** Exhaustiveness helper — same pattern as TrackingType assertNever. */
export function assertNeverTargetSet(x: never): never {
  return assertNever(x as never);
}
