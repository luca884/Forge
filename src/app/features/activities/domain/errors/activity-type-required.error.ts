import { DomainError } from '@core/shared/domain/errors/domain-error';

export class ActivityTypeRequiredError extends DomainError {
  constructor() {
    super('Elegí el tipo de actividad para importar el recorrido.', 'ActivityTypeRequiredError');
  }
}
