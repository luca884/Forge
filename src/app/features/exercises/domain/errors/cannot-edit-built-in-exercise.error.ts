import { DomainError } from '@core/shared/domain/errors/domain-error';

export class CannotEditBuiltInExerciseError extends DomainError {
  constructor(public readonly exerciseId: string) {
    super(`Cannot edit a seed exercise: "${exerciseId}"`, 'CannotEditBuiltInExerciseError');
  }
}
