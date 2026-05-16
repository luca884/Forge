import { Injectable, inject } from '@angular/core';
import { Session } from '../session.entity';
import { SessionRepository } from '../session.repository';

@Injectable()
export class GetActiveSessionUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  execute(): Promise<Session | null> {
    return this.sessionRepo.getActive();
  }
}
