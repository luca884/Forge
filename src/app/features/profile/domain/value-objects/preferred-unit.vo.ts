import { DomainError } from '@core/shared/domain/errors/domain-error';

export type PreferredUnit = 'kg' | 'lb';

export function isPreferredUnit(raw: unknown): raw is PreferredUnit {
  return raw === 'kg' || raw === 'lb';
}

class InvalidPreferredUnitError extends DomainError {
  constructor(raw: unknown) {
    super(`Invalid preferred unit: ${String(raw)}`, 'InvalidPreferredUnitError');
  }
}

// Namespace to allow PreferredUnit.from(raw) syntax
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PreferredUnit {
  export function from(raw: unknown): PreferredUnit {
    if (!isPreferredUnit(raw)) {
      throw new InvalidPreferredUnitError(raw);
    }
    return raw;
  }
}
