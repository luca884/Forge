import { DomainError } from '@core/shared/domain/errors/domain-error';

export class ActivityNotFoundError extends DomainError {
  constructor(public readonly activityId: string) {
    super('No se encontró la actividad.', 'ActivityNotFoundError');
  }
}
