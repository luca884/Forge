import { DomainError } from '@core/shared/domain/errors/domain-error';

/** Past-session corrections skip the session in progress: its sets are corrected inside the session. */
export class SessionStillInProgressError extends DomainError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} is still in progress: correct its sets from the session.`, 'SessionStillInProgressError');
  }
}
