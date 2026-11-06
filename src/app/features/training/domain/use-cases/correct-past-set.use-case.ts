import { Injectable, inject } from '@angular/core';
import { DomainError } from '@core/shared/domain/errors/domain-error';
import { EventBus } from '@core/shared/events/event-bus';
import { SessionRepository } from '../session.repository';
import { ExerciseHistoryStore } from '../exercise-history.store';
import { ExerciseRecordsRebuilder } from '../services/exercise-records-rebuilder';
import type { WorkedSet } from '../worked-set';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { SessionStillInProgressError } from '../errors/session-still-in-progress.error';
import type { WorkedSetEditedEvent } from '../events/worked-set-edited.event';
import type { WorkedSetRemovedEvent } from '../events/worked-set-removed.event';

class SetNotInSessionError extends DomainError {
  constructor(setId: string, sessionId: string) {
    super(`Set ${setId} is not part of session ${sessionId}`, 'SetNotInSessionError');
  }
}

/**
 * Corrects a set of a finished session: edits its values or removes it, then rebuilds the
 * exercise's records, since a corrected old set can change which later sets were records.
 */
@Injectable()
export class CorrectPastSetUseCase {
  private readonly sessions = inject(SessionRepository);
  private readonly history = inject(ExerciseHistoryStore);
  private readonly rebuilder = inject(ExerciseRecordsRebuilder);
  private readonly eventBus = inject(EventBus);

  /** Saves the set's new values; its session, exercise, type and time stay as they were. */
  async edit(sessionId: string, updated: WorkedSet): Promise<void> {
    const previous = await this.storedSet(sessionId, updated.id);
    const newSet = {
      ...updated,
      id: previous.id,
      sessionId: previous.sessionId,
      exerciseId: previous.exerciseId,
      type: previous.type,
      createdAt: previous.createdAt,
    } as WorkedSet;

    const sets = (await this.sessions.getAllWorkedSetsForExercise(previous.exerciseId)).map((s) =>
      s.id === previous.id ? newSet : s,
    );
    const rebuilt = await this.rewrite(previous.exerciseId, sets, []);

    this.eventBus.publish<WorkedSetEditedEvent>({
      name: 'WorkedSetEdited',
      occurredAt: new Date(),
      sessionId,
      previousSet: previous,
      newSet: rebuilt.find((s) => s.id === previous.id) ?? newSet,
    });
  }

  async remove(sessionId: string, setId: string): Promise<void> {
    const removed = await this.storedSet(sessionId, setId);
    const sets = (await this.sessions.getAllWorkedSetsForExercise(removed.exerciseId)).filter((s) => s.id !== setId);
    await this.rewrite(removed.exerciseId, sets, [setId]);

    this.eventBus.publish<WorkedSetRemovedEvent>({
      name: 'WorkedSetRemoved',
      occurredAt: new Date(),
      sessionId,
      removedSet: removed,
    });
  }

  private async storedSet(sessionId: string, setId: string): Promise<WorkedSet> {
    const session = await this.sessions.getById(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);
    if (session.status === 'in-progress') throw new SessionStillInProgressError(sessionId);
    const set = (await this.sessions.getSetsForSession(sessionId)).find((s) => s.id === setId);
    if (!set) throw new SetNotInSessionError(setId, sessionId);
    return set;
  }

  private async rewrite(exerciseId: string, sets: readonly WorkedSet[], removedSetIds: string[]): Promise<readonly WorkedSet[]> {
    const rebuilt = this.rebuilder.rebuild(sets);
    await this.history.rewrite({ exerciseId, removedSetIds, sets: rebuilt.sets, records: rebuilt.records });
    return rebuilt.sets;
  }
}
