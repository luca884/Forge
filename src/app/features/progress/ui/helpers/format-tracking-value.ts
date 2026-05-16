/**
 * Pure display helper — formats a WorkedSet value as a human-readable string.
 * No Angular DI. No side effects.
 * D-6: accepts optional second parameter `unit` (default 'kg') for unit-aware formatting.
 */
import type { WorkedSet } from '@features/training/domain/worked-set';
import { assertNever } from '@core/shared/domain/tracking-type';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

/** Inline unit formatter — mirrors DisplayWeightPipe.transform logic. */
function applyUnit(kg: number, unit: PreferredUnit): string {
  return unit === 'lb' ? `${(kg * 2.20462).toFixed(1)} lb` : `${kg} kg`;
}

export function formatTrackingValue(set: WorkedSet, unit: PreferredUnit = 'kg'): string {
  switch (set.type) {
    case 'weight-reps':
      return `${applyUnit(set.weight.value, unit)} × ${set.reps.value} reps`;
    case 'bodyweight-reps': {
      const extra = set.extraWeight ? ` (+${applyUnit(set.extraWeight.value, unit)})` : '';
      return `${set.reps.value} reps${extra}`;
    }
    case 'time': {
      const min = Math.floor(set.durationSec / 60);
      const sec = set.durationSec % 60;
      return min > 0 ? `${min}:${String(sec).padStart(2, '0')} min` : `${sec}s`;
    }
    case 'distance-time':
      return `${set.distanceKm} km`;
    default:
      return assertNever(set);
  }
}
