/**
 * personal-record.mapper.ts
 * Bidirectional mapper between PersonalRecord (domain) and PersonalRecordRow (DB).
 *
 * toPersonalRecord — reconstructs the WorkedSet from denormalized row fields
 *   by delegating to workedSetFromRowParts (reuse, D-11/R3, task 1.3).
 * toPersonalRecordRow — flattens the PersonalRecord into a DB row.
 *
 * No imports from @angular/*, rxjs, or ui/. D-11/R5.
 */
import { PersonalRecordRow } from '@core/db/database';
import { assertNever } from '@core/shared/domain/tracking-type';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { WorkedSet } from '@features/training/domain/worked-set';
import { workedSetFromRowParts } from '@features/training/data/worked-set.mapper';

// ─── domain → row ─────────────────────────────────────────────────────────────

export function toPersonalRecordRow(record: PersonalRecord): PersonalRecordRow {
  const now = new Date();
  const base: PersonalRecordRow = {
    id: record.id,
    exerciseId: record.exerciseId,
    trackingType: record.trackingType,
    workedSetId: record.workedSetId,
    achievedAt: record.achievedAt,
    createdAt: record.set.createdAt,
    updatedAt: now,
  };

  const set = record.set;

  switch (set.type) {
    case 'weight-reps':
      return { ...base, reps: set.reps.value, weightKg: set.weight.value };

    case 'bodyweight-reps':
      return {
        ...base,
        reps: set.reps.value,
        extraWeightKg: set.extraWeight?.value,
      };

    case 'time':
      return { ...base, durationSec: set.durationSec };

    case 'distance-time':
      return { ...base, distanceKm: set.distanceKm, durationSec: set.durationSec };

    default:
      return assertNever(set);
  }
}

// ─── row → domain ─────────────────────────────────────────────────────────────

export function toPersonalRecord(row: PersonalRecordRow): PersonalRecord {
  const set = workedSetFromRow(row);
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    trackingType: row.trackingType as PersonalRecord['trackingType'],
    workedSetId: row.workedSetId,
    achievedAt: row.achievedAt,
    set,
  };
}

/**
 * Reconstruct WorkedSet from PersonalRecordRow by adapting to WorkedSetRowParts
 * and delegating to the shared workedSetFromRowParts function. D-11/R3, task 1.3.
 *
 * sessionId is not stored in PersonalRecordRow — the reconstructed WorkedSet
 * is a denormalized display copy; session context is not needed for PR display.
 */
function workedSetFromRow(row: PersonalRecordRow): WorkedSet {
  return workedSetFromRowParts({
    id: row.workedSetId,
    sessionId: '', // denormalized display copy — no session join needed
    exerciseId: row.exerciseId,
    type: row.trackingType,
    isPR: true,
    createdAt: row.createdAt,
    reps: row.reps,
    weightKg: row.weightKg,
    extraWeightKg: row.extraWeightKg,
    durationSec: row.durationSec,
    distanceKm: row.distanceKm,
  });
}
