/**
 * Pure UI helper — no Angular DI, no use cases.
 * Maps WorkedSet[] to LineChartSeries[] for <fg-line-chart>.
 * OneRepMax Epley formula applied inline per D-30/D-34 (bare Chart.js approach).
 *
 * TDD strict — see time-series.spec.ts (written RED-first).
 */
import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import type { WorkedSet } from '@features/training/domain/worked-set';
import type { TrackingType } from '@core/shared/domain/tracking-type';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { loadKg, type WeightUnit, type WeightUnitInfo } from '@core/shared/domain/weight-unit';

export type Metric = 'weight' | 'reps' | 'volume' | '1rm';

export interface LineChartPoint {
  readonly x: Date;
  readonly y: number;
}

export interface LineChartSeries {
  readonly label: string;
  readonly points: readonly LineChartPoint[];
}

/**
 * The "Peso" metric of a plates exercise is the plate count itself: it is neither
 * converted to lb nor labelled with a weight unit (D4). Volume and 1RM stay in kg.
 */
export function plotsPlates(metric: Metric, exercise?: WeightUnitInfo | null): boolean {
  return metric === 'weight' && exercise?.weightUnit === 'plates';
}

/**
 * Descriptive name of a metric with the unit its values are plotted in: the axis title
 * and the series label (the tooltip prints "<series label>: <value>"). Reps carry no unit
 * and the weight of a plates exercise is named "Placas".
 */
export function metricAxisLabel(metric: Metric, unit: PreferredUnit = 'kg', weightUnit: WeightUnit = 'kg'): string {
  switch (metric) {
    case 'weight':
      return weightUnit === 'plates' ? 'Placas' : `Peso (${unit})`;
    case 'reps':
      return 'Repeticiones';
    case 'volume':
      return `Volumen (${unit}×reps)`;
    case '1rm':
      return `1RM estimado (${unit})`;
  }
}

/**
 * Converts WorkedSet[] into a LineChartSeries array compatible with <fg-line-chart>.
 * Returns a single series. For incompatible metric/trackingType combinations,
 * the series has no points (no crash — D-30/S2). Values stay in kg: `unit` only names
 * the series, the caller converts the values it plots. On a plates exercise (S11) volume and
 * 1RM go through `loadKg` (plates × plate weight) and "Peso" stays the plate count.
 */
export function buildTimeSeries(
  sets: readonly WorkedSet[],
  trackingType: TrackingType,
  metric: Metric,
  unit: PreferredUnit = 'kg',
  exercise?: WeightUnitInfo | null,
): LineChartSeries[] {
  const points = sets.flatMap((set): LineChartPoint[] => {
    const y = extractMetricValue(set, trackingType, metric, exercise);
    if (y === null) return [];
    return [{ x: set.createdAt, y }];
  });

  return [
    {
      label: metricAxisLabel(metric, unit, exercise?.weightUnit),
      points,
    },
  ];
}

function extractMetricValue(
  set: WorkedSet,
  trackingType: TrackingType,
  metric: Metric,
  exercise?: WeightUnitInfo | null,
): number | null {
  // Only weight-reps and bodyweight-reps support weight/reps/volume/1rm metrics.
  // For incompatible combinations, return null (no data point).
  if (metric === 'weight' || metric === 'volume' || metric === '1rm') {
    if (trackingType !== 'weight-reps' && trackingType !== 'bodyweight-reps') return null;
    if (set.type !== 'weight-reps' && set.type !== 'bodyweight-reps') return null;
  }

  if (metric === 'reps') {
    if (set.type !== 'weight-reps' && set.type !== 'bodyweight-reps') return null;
  }

  switch (metric) {
    case 'weight': {
      if (set.type === 'weight-reps') return set.weight.value;
      if (set.type === 'bodyweight-reps') return set.extraWeight?.value ?? 0;
      return null;
    }
    case 'reps': {
      if (set.type === 'weight-reps' || set.type === 'bodyweight-reps') return set.reps.value;
      return null;
    }
    case 'volume': {
      if (set.type === 'weight-reps') return loadKg(set.weight.value, exercise) * set.reps.value;
      if (set.type === 'bodyweight-reps') return (set.extraWeight?.value ?? 0) * set.reps.value;
      return null;
    }
    case '1rm': {
      if (set.type !== 'weight-reps') return null;
      return OneRepMax.epley(loadKg(set.weight.value, exercise), set.reps.value).kg;
    }
  }
}
