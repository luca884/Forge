import { TrackingType } from '@core/shared/domain/tracking-type';
import { WorkedSet } from '@features/training/domain/worked-set';

/**
 * PersonalRecord — represents a set that exceeded the user's previous best
 * for a given exercise and tracking type.
 *
 * Append-only: new PRs always create new rows; old rows are never overwritten.
 * The "current PR" for an exercise is the row with the maximum relevant metric.
 *
 * D-3 spec. CC-15: no imports from Angular, rxjs, dexie, data/, or ui/.
 */
export interface PersonalRecord {
  readonly id: string;
  readonly exerciseId: string;
  readonly trackingType: TrackingType;
  readonly workedSetId: string;
  readonly achievedAt: Date;
  /** Denormalized reconstruction of the PR set for display without DB joins. */
  readonly set: WorkedSet;
}
