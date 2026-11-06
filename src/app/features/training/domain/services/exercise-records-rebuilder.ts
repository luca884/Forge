import { Injectable, inject } from '@angular/core';
import { generateUUID } from '@core/shared/utils/uuid';
import type { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import type { WorkedSet } from '../worked-set';
import { PersonalRecordDetector } from './personal-record-detector';

export interface RebuiltRecords {
  /** Every set of the exercise, oldest first, with `isPR` recomputed. */
  readonly sets: readonly WorkedSet[];
  /** One record per set that is a PR, as LogSetUseCase would have saved them. */
  readonly records: readonly PersonalRecord[];
}

/**
 * Recomputes an exercise's records from its whole history, as if every set had been logged in
 * order with today's values. Used after correcting a past set: a changed or removed set can turn
 * later sets into records or take records away from them.
 */
@Injectable()
export class ExerciseRecordsRebuilder {
  private readonly detector = inject(PersonalRecordDetector);

  rebuild(sets: readonly WorkedSet[], newId: () => string = generateUUID): RebuiltRecords {
    // Stable: sets logged in the same millisecond keep their given order.
    const ordered = [...sets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const rebuilt: WorkedSet[] = [];
    const records: PersonalRecord[] = [];
    for (const set of ordered) {
      const isPR = this.detector.isPR(set, rebuilt);
      const marked = { ...set, isPR } as WorkedSet;
      rebuilt.push(marked);
      if (isPR) {
        records.push({
          id: newId(),
          exerciseId: marked.exerciseId,
          trackingType: marked.type,
          workedSetId: marked.id,
          achievedAt: marked.createdAt,
          set: marked,
        });
      }
    }
    return { sets: rebuilt, records };
  }
}
