import { WorkedSetRow } from '@core/db/database';
import { assertNever } from '@core/shared/domain/tracking-type';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import {
  WorkedSet,
  WeightRepsSet,
  BodyweightRepsSet,
  TimeSet,
  DistanceTimeSet,
} from '../domain/worked-set';

export function toWorkedSet(row: WorkedSetRow): WorkedSet {
  const base = {
    id: row.id,
    sessionId: row.sessionId,
    exerciseId: row.exerciseId,
    targetSetIndex: row.targetSetIndex,
    note: row.note,
    isPR: row.isPR,
    createdAt: row.createdAt,
  };

  const type = row.type as WorkedSet['type'];

  switch (type) {
    case 'weight-reps': {
      const repsResult = Reps.tryFrom(row.reps ?? NaN);
      if (!repsResult.ok) {
        throw new Error(`[worked-set.mapper] Invalid reps in DB row ${row.id}: ${repsResult.error}`);
      }
      const weightResult = Weight.tryFrom(row.weightKg ?? NaN);
      if (!weightResult.ok) {
        throw new Error(`[worked-set.mapper] Invalid weightKg in DB row ${row.id}: ${weightResult.error}`);
      }
      return {
        ...base,
        type: 'weight-reps',
        reps: repsResult.value,
        weight: weightResult.value,
      } as WeightRepsSet;
    }

    case 'bodyweight-reps': {
      const repsResult = Reps.tryFrom(row.reps ?? NaN);
      if (!repsResult.ok) {
        throw new Error(`[worked-set.mapper] Invalid reps in DB row ${row.id}: ${repsResult.error}`);
      }

      let extraWeight: Weight | undefined;
      if (row.extraWeightKg !== undefined) {
        const ewResult = Weight.tryFrom(row.extraWeightKg);
        if (!ewResult.ok) {
          throw new Error(`[worked-set.mapper] Invalid extraWeightKg in DB row ${row.id}: ${ewResult.error}`);
        }
        extraWeight = ewResult.value;
      }

      return {
        ...base,
        type: 'bodyweight-reps',
        reps: repsResult.value,
        extraWeight,
      } as BodyweightRepsSet;
    }

    case 'time':
      return {
        ...base,
        type: 'time',
        durationSec: row.durationSec ?? 0,
      } as TimeSet;

    case 'distance-time':
      return {
        ...base,
        type: 'distance-time',
        distanceKm: row.distanceKm ?? 0,
        durationSec: row.durationSec ?? 0,
      } as DistanceTimeSet;

    default:
      return assertNever(type);
  }
}

export function toWorkedSetRow(set: WorkedSet): WorkedSetRow {
  const base: WorkedSetRow = {
    id: set.id,
    sessionId: set.sessionId,
    exerciseId: set.exerciseId,
    type: set.type,
    isPR: set.isPR,
    createdAt: set.createdAt,
    targetSetIndex: set.targetSetIndex,
    note: set.note,
  };

  switch (set.type) {
    case 'weight-reps':
      return {
        ...base,
        reps: set.reps.value,
        weightKg: set.weight.value,
      };

    case 'bodyweight-reps':
      return {
        ...base,
        reps: set.reps.value,
        extraWeightKg: set.extraWeight?.value,
      };

    case 'time':
      return {
        ...base,
        durationSec: set.durationSec,
      };

    case 'distance-time':
      return {
        ...base,
        distanceKm: set.distanceKm,
        durationSec: set.durationSec,
      };

    default:
      return assertNever(set);
  }
}
