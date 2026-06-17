import { assertNever } from '@core/shared/domain/tracking-type';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { WorkedSet } from '../../domain/worked-set';

/** Raw form values coming out of the SetLogger when editing an existing set. */
export interface SetEditValues {
  reps?: number | null;
  weightKg?: number | null;
  extraWeightKg?: number | null;
  durationSec?: number | null;
  distanceKm?: number | null;
}

/**
 * Builds an updated WorkedSet from an existing one + edited form values.
 *
 * Preserves identity and metadata (id, createdAt, note, targetSetIndex, isPR…)
 * via spread — only the tracking-type-specific fields are rebuilt. `isPR` is
 * left as-is on purpose: EditWorkedSetUseCase recomputes it on save.
 *
 * Assumes values are already valid (the SetLogger form blocks invalid submits);
 * the Reps/Weight constructors throw on invalid input as a last-resort guard.
 */
export function applySetEdit(original: WorkedSet, values: SetEditValues): WorkedSet {
  switch (original.type) {
    case 'weight-reps':
      return {
        ...original,
        reps: new Reps(values.reps ?? 0),
        weight: new Weight(values.weightKg ?? 0),
      };
    case 'bodyweight-reps':
      return {
        ...original,
        reps: new Reps(values.reps ?? 0),
        extraWeight:
          values.extraWeightKg != null && values.extraWeightKg > 0
            ? new Weight(values.extraWeightKg)
            : undefined,
      };
    case 'time':
      return { ...original, durationSec: values.durationSec ?? 0 };
    case 'distance-time':
      return {
        ...original,
        distanceKm: values.distanceKm ?? 0,
        durationSec: values.durationSec ?? 0,
      };
    default:
      return assertNever(original);
  }
}
