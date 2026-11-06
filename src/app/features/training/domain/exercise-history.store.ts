import type { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import type { WorkedSet } from './worked-set';

/** An exercise's corrected history: what to delete, every remaining set, and its rebuilt records. */
export interface ExerciseHistoryRewrite {
  readonly exerciseId: string;
  readonly removedSetIds: readonly string[];
  /** Every remaining set of the exercise, with `isPR` recomputed. */
  readonly sets: readonly WorkedSet[];
  /** Replace every record of the exercise. */
  readonly records: readonly PersonalRecord[];
}

/** Writes a corrected exercise history. All or nothing: on failure, nothing changes. */
export abstract class ExerciseHistoryStore {
  abstract rewrite(change: ExerciseHistoryRewrite): Promise<void>;
}
