import { Injectable, inject } from '@angular/core';
import { Session } from '../session.entity';
import { SessionRepository } from '../session.repository';
import { SessionAlreadyInProgressError } from '../errors/session-already-in-progress.error';
import { generateUUID } from '@core/shared/utils/uuid';

export interface StartSessionInput {
  routineId: string;
  dayId: string;
}

@Injectable()
export class StartSessionUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  async execute(input: StartSessionInput): Promise<Session> {
    const activeSession = await this.sessionRepo.getActive();

    if (activeSession) {
      throw new SessionAlreadyInProgressError(activeSession.id);
    }

    const now = new Date();
    const session: Session = {
      id: generateUUID(),
      routineId: input.routineId,
      dayId: input.dayId,
      date: now.toISOString().slice(0, 10),
      startedAt: now,
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
    };

    await this.sessionRepo.save(session);
    return session;
  }
}
