import { TrackingType } from '@core/shared/domain/tracking-type';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';

/**
 * PersonalRecordRepository port — abstract class defining the contract for
 * PR persistence. Append-only invariant: save() always inserts a new row;
 * no update() or delete() methods exist on this port (CC-16, D-9/R5).
 *
 * Placement in core/shared/domain/ports/ per design ADR-11:
 * shared by training.routes.ts (writes) and progress.routes.ts (reads).
 *
 * CC-16: No imports from Angular, rxjs, or dexie.
 */
export abstract class PersonalRecordRepository {
  /**
   * Insert a new PersonalRecord row. Always append-only — never update.
   * D-9/R2, D-9/R5.
   */
  abstract save(record: PersonalRecord): Promise<void>;

  /**
   * Return a PersonalRecord by its id, or null if not found.
   * D-9/R2.
   */
  abstract getById(id: string): Promise<PersonalRecord | null>;

  /**
   * Return the PersonalRecord with the highest relevant metric for the given
   * exerciseId and trackingType (the "current PR"), or null if none exists.
   *
   * MAX logic per trackingType:
   * - weight-reps → max weightKg
   * - bodyweight-reps → max reps or extraWeightKg
   * - time → min durationSec
   * - distance-time → max distanceKm
   *
   * D-9/R2, D-9/R3.
   */
  abstract getCurrentForExercise(
    exerciseId: string,
    trackingType: TrackingType,
  ): Promise<PersonalRecord | null>;

  /**
   * Return all PersonalRecord rows, optionally filtered by exerciseId,
   * ordered by achievedAt descending.
   * D-9/R2, D-9/R4.
   */
  abstract listAll(exerciseId?: string): Promise<PersonalRecord[]>;

  /**
   * Return true if at least one PersonalRecord exists for the given exerciseId.
   * Used by DeleteCustomExerciseUseCase to block deletion when a PR references the exercise.
   * P3-2.
   */
  abstract existsByExerciseId(exerciseId: string): Promise<boolean>;
}
