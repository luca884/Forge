import { Injectable, inject } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import { SessionRepository } from '../session.repository';
import { PersonalRecordDetector } from '../services/personal-record-detector';
import { WorkedSet } from '../worked-set';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { WorkedSetEditedEvent } from '../events/worked-set-edited.event';

export interface EditWorkedSetInput {
  sessionId: string;
  updatedSet: WorkedSet;
}

@Injectable()
export class EditWorkedSetUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly prDetector = inject(PersonalRecordDetector);
  private readonly eventBus = inject(EventBus);

  async execute(input: EditWorkedSetInput): Promise<WorkedSet> {
    const session = await this.sessionRepo.getById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);
    if (session.status !== 'in-progress') {
      throw new SessionNotInProgressError(input.sessionId, session.status);
    }

    // Get history excluding the old version of this set for re-running PR detection
    const history = await this.sessionRepo.getAllWorkedSetsForExercise(input.updatedSet.exerciseId);
    const historyWithoutThis = history.filter(s => s.id !== input.updatedSet.id);
    const isPR = this.prDetector.isPR(input.updatedSet, historyWithoutThis);
    const finalSet: WorkedSet = { ...input.updatedSet, isPR } as WorkedSet;

    // Find previous version from history before editing
    const previousSet = history.find(s => s.id === input.updatedSet.id) ?? input.updatedSet;

    await this.sessionRepo.editWorkedSet(input.sessionId, finalSet);

    this.eventBus.publish<WorkedSetEditedEvent>({
      name: 'WorkedSetEdited',
      occurredAt: new Date(),
      sessionId: input.sessionId,
      previousSet,
      newSet: finalSet,
    });

    return finalSet;
  }
}
