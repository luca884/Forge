import { Injectable, inject } from '@angular/core';
import { PersonalRecord } from '../entities/personal-record.entity';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';

/**
 * Returns all PersonalRecord rows, optionally filtered by exerciseId.
 * Delegates entirely to the repository (ordering is repo's responsibility:
 * achievedAt DESC per D-13/R3 and D-9/R4).
 *
 * D-13 spec. CC-1/CC-3: Injectable + inject(). No dexie/rxjs/data/ui imports.
 */
@Injectable()
export class GetAllPersonalRecordsUseCase {
  private readonly personalRecordRepo = inject(PersonalRecordRepository);

  execute(exerciseId?: string): Promise<PersonalRecord[]> {
    return this.personalRecordRepo.listAll(exerciseId);
  }
}
