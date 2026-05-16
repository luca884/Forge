import { DomainError } from '@core/shared/domain/errors/domain-error';

export class CannotDeleteBuiltInExerciseError extends DomainError {
  constructor(public readonly exerciseId: string) {
    super(`Cannot delete a seed exercise: "${exerciseId}"`, 'CannotDeleteBuiltInExerciseError');
  }
}
