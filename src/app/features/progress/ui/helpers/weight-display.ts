/**
 * Weight as a number in the preferred unit, for places that need a value and
 * not a string (chart points, axis ticks). Delegates to DisplayWeightPipe so
 * the conversion factor and the rounding live in one place.
 * Pure UI helper — no Angular DI.
 */
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

const pipe = new DisplayWeightPipe();

export function displayWeightValue(kg: number, unit: PreferredUnit): number {
  // lb: the pipe already rounds to one decimal. kg: it prints the raw number,
  // so round here to keep float noise (126.66666…) off the screen.
  return unit === 'lb' ? parseFloat(pipe.transform(kg, unit)) : Math.round(kg * 10) / 10;
}
