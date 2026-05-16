/**
 * Pure display helper — formats a WorkedSet value as a human-readable string.
 * No Angular DI. No side effects.
 */
import type { WorkedSet } from '@features/training/domain/worked-set';
import { assertNever } from '@core/shared/domain/tracking-type';

export function formatTrackingValue(set: WorkedSet): string {
  switch (set.type) {
    case 'weight-reps':
      return `${set.weight.value} kg × ${set.reps.value} reps`;
    case 'bodyweight-reps': {
      const extra = set.extraWeight ? ` (+${set.extraWeight.value} kg)` : '';
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
