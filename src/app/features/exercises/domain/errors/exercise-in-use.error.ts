import { DomainError } from '@core/shared/domain/errors/domain-error';

export class ExerciseInUseError extends DomainError {
  constructor(public readonly exerciseId: string) {
    super(`No se puede borrar: el ejercicio está en uso ("${exerciseId}")`, 'ExerciseInUseError');
  }
}
