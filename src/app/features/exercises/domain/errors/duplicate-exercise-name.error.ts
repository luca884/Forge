import { DomainError } from '@core/shared/domain/errors/domain-error';

export class DuplicateExerciseNameError extends DomainError {
  constructor(public readonly exerciseName: string) {
    super(`Exercise name already exists: "${exerciseName}"`, 'DuplicateExerciseNameError');
  }
}
