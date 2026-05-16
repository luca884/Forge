import { DomainError } from '@core/shared/domain/errors/domain-error';
import { PreferredUnit } from './value-objects/preferred-unit.vo';

export interface Profile {
  readonly id: 'me';
  readonly name: string;
  readonly avatarBase64?: string;
  readonly preferredUnit: PreferredUnit;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class InvalidProfileInputError extends DomainError {
  constructor(reason: string) {
    super(`Invalid profile input: ${reason}`, 'InvalidProfileInputError');
  }
}

export function createProfile(
  name: string,
  preferredUnit: PreferredUnit = 'kg',
  avatarBase64?: string,
): Profile {
  if (name.trim() === '') {
    throw new InvalidProfileInputError('name must not be empty');
  }

  const now = new Date();
  return {
    id: 'me',
    name,
    avatarBase64,
    preferredUnit,
    createdAt: now,
    updatedAt: now,
  };
}
