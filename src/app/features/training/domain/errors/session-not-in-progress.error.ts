import { DomainError } from '@core/shared/domain/errors/domain-error';

export class SessionNotInProgressError extends DomainError {
  constructor(sessionId: string, status: string) {
    super(
      `Session ${sessionId} is not in progress (status: ${status}). Only in-progress sessions can be modified.`,
      'SessionNotInProgressError',
    );
  }
}
