import { Injectable, inject } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import { SessionRepository } from '../session.repository';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { WorkedSetRemovedEvent } from '../events/worked-set-removed.event';

export interface RemoveWorkedSetInput {
  sessionId: string;
  setId: string;
}

@Injectable()
export class RemoveWorkedSetUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly eventBus = inject(EventBus);

  async execute(input: RemoveWorkedSetInput): Promise<void> {
    const session = await this.sessionRepo.getById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);
    if (session.status !== 'in-progress') {
      throw new SessionNotInProgressError(input.sessionId, session.status);
    }

    // Find the set before removing for event payload
    const allSets = await this.sessionRepo.getAllWorkedSetsForExercise('');
    const removedSet = allSets.find(s => s.id === input.setId);

    await this.sessionRepo.removeWorkedSet(input.sessionId, input.setId);

    if (removedSet) {
      this.eventBus.publish<WorkedSetRemovedEvent>({
        name: 'WorkedSetRemoved',
        occurredAt: new Date(),
        sessionId: input.sessionId,
        removedSet,
      });
    }
  }
}
