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

  async execute({ exerciseId }: { exerciseId: string }): Promise<WorkedSet[]> {
    const sets = await this.sessionRepo.getAllWorkedSetsForExercise(exerciseId);
    // Defensive sort: guarantee createdAt ASC regardless of repo ordering (time-series for charts).
    // Primary ordering responsibility stays with the repo per ADR-15; this is a safety net.
    return sets.slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
