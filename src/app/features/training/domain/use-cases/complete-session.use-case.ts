import { Injectable, inject } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import { Session } from '../session.entity';
import { SessionRepository } from '../session.repository';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { SessionCompletedEvent } from '../events/session-completed.event';

export interface CompleteSessionInput {
  sessionId: string;
}

@Injectable()
export class CompleteSessionUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly eventBus = inject(EventBus);

  async execute(input: CompleteSessionInput): Promise<Session> {
    const session = await this.sessionRepo.getById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);
    if (session.status !== 'in-progress') {
      throw new SessionNotInProgressError(input.sessionId, session.status);
    }

    const now = new Date();
    const completedSession: Session = {
      ...session,
      status: 'completed',
      endedAt: now,
      updatedAt: now,
    };

    await this.sessionRepo.save(completedSession);

    this.eventBus.publish<SessionCompletedEvent>({
      name: 'SessionCompleted',
      occurredAt: now,
      sessionId: input.sessionId,
      completedAt: now,
    });

    return completedSession;
  }
}
