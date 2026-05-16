import { DomainError } from '@core/shared/domain/errors/domain-error';

export class ExerciseNotFoundError extends DomainError {
  constructor(public readonly exerciseId: string) {
    super(`Exercise not found: "${exerciseId}"`, 'ExerciseNotFoundError');
  }
}
