import { Injectable, inject } from '@angular/core';
import { WorkedSet } from '../worked-set';
import { SessionRepository } from '../session.repository';

@Injectable()
export class GetPreviousSessionSetsUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  /**
   * Returns the sets logged for this exercise in the most recent session that is
   * NOT the active one, ordered by set slot (targetSetIndex, falling back to
   * createdAt when the slot is unknown).
   *
   * The training UI uses it to prefill each set input with what was actually
   * done last time, slot by slot: set 1 shows last session's set 1, and so on.
   * Returns an empty array when the exercise has no previous session.
   */
  async execute(exerciseId: string, activeSessionId: string): Promise<WorkedSet[]> {
    const allSets = await this.sessionRepo.getAllWorkedSetsForExercise(exerciseId);
    const previousSets = allSets.filter((s) => s.sessionId !== activeSessionId);
    if (previousSets.length === 0) return [];

    const mostRecent = previousSets.reduce((best, s) =>
      s.createdAt > best.createdAt ? s : best,
    );

    return previousSets
      .filter((s) => s.sessionId === mostRecent.sessionId)
      .sort((a, b) => {
        const aIdx = a.targetSetIndex;
        const bIdx = b.targetSetIndex;
        if (aIdx !== undefined && bIdx !== undefined && aIdx !== bIdx) return aIdx - bIdx;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
}
