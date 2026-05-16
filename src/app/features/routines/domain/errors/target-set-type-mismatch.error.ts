import { DomainError } from '@core/shared/domain/errors/domain-error';

export class TargetSetTypeMismatchError extends DomainError {
  constructor(
    public readonly exerciseId: string,
    public readonly expectedType: string,
    public readonly receivedType: string,
  ) {
    super(
      `TargetSet type mismatch for exercise ${exerciseId}: expected '${expectedType}', received '${receivedType}'`,
      'TargetSetTypeMismatchError',
    );
  }
}
