import { DomainError } from '@core/shared/domain/errors/domain-error';

export class ExerciseNameRequiredError extends DomainError {
  constructor() {
    super('Name is required', 'ExerciseNameRequiredError');
  }
}
