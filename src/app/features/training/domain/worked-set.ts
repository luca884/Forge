import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { WorkedSetBase } from '@core/shared/domain/worked-set-base';

export interface WeightRepsSet extends WorkedSetBase {
  readonly type: 'weight-reps';
  readonly reps: Reps;
  readonly weight: Weight;
}

export interface BodyweightRepsSet extends WorkedSetBase {
  readonly type: 'bodyweight-reps';
  readonly reps: Reps;
  readonly extraWeight?: Weight;
}

export interface TimeSet extends WorkedSetBase {
  readonly type: 'time';
  readonly durationSec: number;
}

export interface DistanceTimeSet extends WorkedSetBase {
  readonly type: 'distance-time';
  readonly distanceKm: number;
  readonly durationSec: number;
}

export type WorkedSet = WeightRepsSet | BodyweightRepsSet | TimeSet | DistanceTimeSet;
