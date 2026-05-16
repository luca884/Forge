import { Injectable, inject } from '@angular/core';
import { WorkedSet } from '@features/training/domain/worked-set';
import { SessionRepository } from '@features/training/domain/session.repository';

/**
 * Returns all WorkedSets for a given exercise across ALL sessions,
 * ordered by createdAt ascending (chronological, for chart rendering).
 *
 * Reuses SessionRepository per ADR-15: no new ExerciseHistoryRepository port.
 * The cross-feature dependency is on the abstract port only — clean boundary
 * preserved. Progress adapters wire DexieSessionRepository in progress.routes.ts.
 *
 * D-15 spec. CC-1/CC-3: Injectable + inject(). No dexie/rxjs/data/ui imports.
 */
@Injectable()
export class GetExerciseHistoryUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  execute({ exerciseId }: { exerciseId: string }): Promise<WorkedSet[]> {
    return this.sessionRepo.getAllWorkedSetsForExercise(exerciseId);
  }
}
