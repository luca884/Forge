import { Injectable, inject } from '@angular/core';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { PersonalRecord } from '../entities/personal-record.entity';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';

/**
 * Returns the current PersonalRecord (highest relevant metric) for a given
 * exercise and tracking type, or null if no PR has been recorded.
 *
 * "Current PR" = the row with the maximum relevant metric per trackingType:
 * weight-reps → max weightKg, bodyweight-reps → max reps, time → min durationSec,
 * distance-time → max distanceKm. Selection logic is owned by the repository.
 *
 * D-14 spec. CC-1/CC-3: Injectable + inject(). No dexie/rxjs/data/ui imports.
 */
@Injectable()
export class GetCurrentPRForExerciseUseCase {
  private readonly personalRecordRepo = inject(PersonalRecordRepository);

  execute(exerciseId: string, trackingType: TrackingType): Promise<PersonalRecord | null> {
    return this.personalRecordRepo.getCurrentForExercise(exerciseId, trackingType);
  }
}
