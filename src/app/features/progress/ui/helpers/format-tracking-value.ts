/**
 * Pure display helper — formats a WorkedSet value as a human-readable string.
 * No Angular DI. No side effects.
 * D-6: accepts optional second parameter `unit` (default 'kg') for unit-aware formatting.
 * Slice A: accepts optional third parameter `weightUnit` (default 'kg') for plates support.
 */
import type { WorkedSet } from '@features/training/domain/worked-set';
import { assertNever } from '@core/shared/domain/tracking-type';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { WeightUnit } from '@core/shared/domain/weight-unit';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';

const displayWeight = new DisplayWeightPipe();

/** Single source of truth for weight formatting: the same pipe the templates use. */
function applyUnit(kg: number, unit: PreferredUnit): string {
  return displayWeight.transform(kg, unit);
}

/** "1 placa", "7 placas": a plates set is never converted to lb nor suffixed "kg" (D4). */
function formatPlates(count: number): string {
  return `${count} ${count === 1 ? 'placa' : 'placas'}`;
}

/**
 * Compact "best set" for tables and tiles: "100 kg × 5" (no "reps" suffix).
 * Non weight-reps sets fall back to formatTrackingValue.
 */
export function formatBestSet(
  set: WorkedSet,
  unit: PreferredUnit = 'kg',
  weightUnit: WeightUnit = 'kg',
): string {
  if (set.type !== 'weight-reps') return formatTrackingValue(set, unit, weightUnit);
  const weight = weightUnit === 'plates' ? formatPlates(set.weight.value) : applyUnit(set.weight.value, unit);
  return `${weight} × ${set.reps.value}`;
}

export function formatTrackingValue(
  set: WorkedSet,
  unit: PreferredUnit = 'kg',
  weightUnit: WeightUnit = 'kg',
): string {
  switch (set.type) {
    case 'weight-reps':
      if (weightUnit === 'plates') {
        return `${formatPlates(set.weight.value)} × ${set.reps.value} reps`;
      }
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
