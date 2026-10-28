/**
 * <fg-exercise-history-chart> — higher-level chart component (D-6, D-30).
 * Composes <fg-line-chart> with metric and range selection logic.
 * Imports WorkedSet from training domain (read-only — no DI, no side effects).
 *
 * DOES NOT import from chart.js or ng2-charts — only from <fg-line-chart> (CC-18 / ADR-13).
 * Cuaderno: metric and range selectors are real buttons (aria-pressed) in labelled groups.
 * Weight-based metrics are plotted in the preferred unit, so the axis label and the
 * values agree.
 */
import { Component, computed, input, signal } from '@angular/core';
import type { WorkedSet } from '@features/training/domain/worked-set';
import type { TrackingType } from '@core/shared/domain/tracking-type';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { buildTimeSeries, metricAxisLabel, type LineChartSeries, type Metric } from '../../helpers/time-series';
import { displayWeightValue } from '../../helpers/weight-display';
import { LineChartComponent } from '../line-chart/line-chart.component';

const METRIC_LABELS: Record<Metric, string> = {
  weight: 'Peso',
  reps: 'Reps',
  volume: 'Volumen',
  '1rm': '1RM est.',
};

/** Metrics available for weight-based exercises */
const WEIGHT_METRICS: readonly Metric[] = ['weight', 'reps', 'volume', '1rm'];
/** Metrics available for other exercise types */
const GENERIC_METRICS: readonly Metric[] = ['reps'];
/** Metrics whose values are weights and must follow the preferred unit */
const WEIGHT_VALUED: readonly Metric[] = ['weight', 'volume', '1rm'];

export type HistoryRange = '3m' | '6m' | '1y' | 'all';

const RANGES: readonly { readonly id: HistoryRange; readonly label: string; readonly months: number | null }[] = [
  { id: '3m', label: '3M', months: 3 },
  { id: '6m', label: '6M', months: 6 },
  { id: '1y', label: '1A', months: 12 },
  { id: 'all', label: 'Todo', months: null },
];

const SELECTOR_BUTTON =
  'h-[30px] px-2.5 border-0 rounded-md text-xs cursor-pointer whitespace-nowrap';

@Component({
  selector: 'fg-exercise-history-chart',
  standalone: true,
  imports: [LineChartComponent],
  template: `
    @if (sets().length === 0) {
      <div class="empty-state text-center p-8">
        <p class="text-[13px] leading-[18px] text-ink-2">Sin historial registrado para este ejercicio.</p>
      </div>
    } @else {
      <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 mb-2.5">
        <div role="group" aria-label="Métrica" class="flex gap-0.5 p-0.5 rounded-lg border border-line bg-page">
          @for (m of availableMetrics(); track m) {
            <button
              type="button"
              [class]="metricClass(m)"
              [attr.aria-pressed]="selectedMetric() === m"
              (click)="selectedMetric.set(m)"
            >{{ metricLabel(m) }}</button>
          }
        </div>
        <div role="group" aria-label="Rango" class="flex gap-0.5">
          @for (r of ranges; track r.id) {
            <button
              type="button"
              [class]="rangeClass(r.id)"
              [attr.aria-pressed]="range() === r.id"
              (click)="range.set(r.id)"
            >{{ r.label }}</button>
          }
        </div>
      </div>
      <fg-line-chart
        [series]="series()"
        [yAxisLabel]="yLabel()"
        xAxisLabel=""
        gradient="accent"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ExerciseHistoryChartComponent {
  readonly sets = input.required<readonly WorkedSet[]>();
  readonly trackingType = input.required<TrackingType>();

  /** Preferred weight unit — used for axis labels (D-9, ADR-22). Chart data values remain in kg. */
  readonly unit = input<PreferredUnit>('kg');

  readonly selectedMetric = signal<Metric>('weight');
  readonly range = signal<HistoryRange>('all');
  protected readonly ranges = RANGES;

  readonly availableMetrics = computed<readonly Metric[]>(() => {
    const tt = this.trackingType();
    return tt === 'weight-reps' || tt === 'bodyweight-reps'
      ? WEIGHT_METRICS
      : GENERIC_METRICS;
  });

  /** Sets inside the selected range, counted back from now. */
  private readonly rangedSets = computed<readonly WorkedSet[]>(() => {
    const months = RANGES.find((r) => r.id === this.range())?.months ?? null;
    if (months === null) return this.sets();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return this.sets().filter((set) => set.createdAt >= cutoff);
  });

  /** Chart data in the preferred unit (the helper builds it in kg). */
  readonly series = computed<LineChartSeries[]>(() => {
    const metric = this.selectedMetric();
    const unit = this.unit();
    const built = buildTimeSeries(this.rangedSets(), this.trackingType(), metric, unit);
    if (unit === 'kg' || !WEIGHT_VALUED.includes(metric)) return built;
    return built.map((s) => ({
      ...s,
      points: s.points.map((p) => ({ x: p.x, y: displayWeightValue(p.y, unit) })),
    }));
  });

  /** Axis title; the series carries the same text, so the tooltip names the unit too. */
  readonly yLabel = computed(() => metricAxisLabel(this.selectedMetric(), this.unit()));

  metricLabel(m: Metric): string {
    return METRIC_LABELS[m];
  }

  protected metricClass(m: Metric): string {
    return `${SELECTOR_BUTTON} ${
      this.selectedMetric() === m ? 'bg-surface text-accent-ink font-semibold' : 'bg-transparent text-ink-2 font-medium'
    }`;
  }

  protected rangeClass(id: HistoryRange): string {
    return `${SELECTOR_BUTTON} px-2 font-mono ${
      this.range() === id ? 'bg-accent-soft text-accent-ink font-medium' : 'bg-transparent text-ink-2'
    }`;
  }
}
