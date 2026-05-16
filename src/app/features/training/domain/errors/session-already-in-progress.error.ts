import { DomainError } from '@core/shared/domain/errors/domain-error';

export class SessionAlreadyInProgressError extends DomainError {
  constructor(public readonly existingSessionId: string) {
    super(
      `A session is already in progress (id: ${existingSessionId}). Complete or abandon it before starting a new one.`,
      'SessionAlreadyInProgressError',
    );
  }
}
