import { DomainError } from '@core/shared/domain/errors/domain-error';

export class InvalidSetInputError extends DomainError {
  constructor(reason: string) {
    super(`Invalid set input: ${reason}`, 'InvalidSetInputError');
  }
}
