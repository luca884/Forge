import { DomainError } from '@core/shared/domain/errors/domain-error';

export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, 'SessionNotFoundError');
  }
}
