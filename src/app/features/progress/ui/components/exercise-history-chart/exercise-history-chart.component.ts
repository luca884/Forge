/**
 * <fg-exercise-history-chart> — higher-level chart component (D-30).
 * Composes <fg-line-chart> with metric selection logic.
 * Imports WorkedSet from training domain (read-only — no DI, no side effects).
 *
 * DOES NOT import from chart.js or ng2-charts — only from <fg-line-chart> (CC-18).
 */
import { Component, computed, input, signal } from '@angular/core';
import type { WorkedSet } from '@features/training/domain/worked-set';
import type { TrackingType } from '@core/shared/domain/tracking-type';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { buildTimeSeries, type Metric } from '../../helpers/time-series';
import { LineChartComponent } from '../line-chart/line-chart.component';

const METRIC_LABELS: Record<Metric, string> = {
  weight: 'Peso',
  reps: 'Reps',
  volume: 'Volumen',
  '1rm': '1RM',
};

/** Metrics available for weight-based exercises */
const WEIGHT_METRICS: readonly Metric[] = ['weight', 'reps', 'volume', '1rm'];
/** Metrics available for other exercise types */
const GENERIC_METRICS: readonly Metric[] = ['reps'];

@Component({
  selector: 'fg-exercise-history-chart',
  standalone: true,
  imports: [LineChartComponent],
  template: `
    @if (sets().length === 0) {
      <div class="empty-state">
        <p>Sin historial registrado para este ejercicio.</p>
      </div>
    } @else {
      <div class="metric-toggle">
        @for (m of availableMetrics(); track m) {
          <button
            [class.active]="selectedMetric() === m"
            (click)="selectedMetric.set(m)"
          >{{ metricLabel(m) }}</button>
        }
      </div>
      <fg-line-chart
        [series]="series()"
        [yAxisLabel]="yLabel()"
        xAxisLabel="Fecha"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .empty-state {
      text-align: center;
      color: #888;
      padding: 2rem;
      font-size: 0.9rem;
    }
    .metric-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .metric-toggle button {
      padding: 0.25rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .metric-toggle button.active {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }
  `,
})
export class ExerciseHistoryChartComponent {
  readonly sets = input.required<readonly WorkedSet[]>();
  readonly trackingType = input.required<TrackingType>();

  /** Preferred weight unit — used for axis labels (D-9, ADR-22). Chart data values remain in kg. */
  readonly unit = input<PreferredUnit>('kg');

  readonly selectedMetric = signal<Metric>('weight');

  readonly availableMetrics = computed<readonly Metric[]>(() => {
    const tt = this.trackingType();
    return tt === 'weight-reps' || tt === 'bodyweight-reps'
      ? WEIGHT_METRICS
      : GENERIC_METRICS;
  });

  readonly series = computed(() =>
    buildTimeSeries(this.sets(), this.trackingType(), this.selectedMetric()),
  );

  readonly yLabel = computed(() => {
    const m = this.selectedMetric();
    const u = this.unit();
    const labels: Record<Metric, string> = {
      weight: `Peso (${u})`,
      reps: 'Repeticiones',
      volume: `Volumen (${u}×reps)`,
      '1rm': `1RM estimado (${u})`,
    };
    return labels[m];
  });

  metricLabel(m: Metric): string {
    return METRIC_LABELS[m];
  }
}
