import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FgCardComponent, FgEmptyStateComponent } from '@core/shared/ui';
import type { WeeklyTrendPoint } from '../../../domain/models/weekly-trend-point.model';
import { LineChartComponent } from '../line-chart/line-chart.component';
import type { LineChartSeries } from '../../helpers/time-series';

@Component({
  selector: 'fg-weekly-trend-chart',
  standalone: true,
  imports: [FgCardComponent, FgEmptyStateComponent, LineChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="t-micro text-forge-500 mb-2">VOLUMEN SEMANAL</div>
      @if (points().length === 0) {
        <fg-empty-state icon="calendar" title="Todavía no hay volumen semanal" />
      } @else {
        <fg-card>
          <fg-line-chart [series]="volumeSeries()" xAxisLabel="Semana" yAxisLabel="Volumen (kg)" gradient="accent" />
          <div class="t-micro text-forge-500 mt-5 mb-2">SESIONES SEMANALES</div>
          <fg-line-chart [series]="sessionSeries()" xAxisLabel="Semana" yAxisLabel="Sesiones" />
        </fg-card>
      }
    </section>
  `,
})
export class WeeklyTrendChartComponent {
  readonly points = input.required<readonly WeeklyTrendPoint[]>();
  readonly volumeSeries = computed<readonly LineChartSeries[]>(() => [
    { label: 'Volumen (kg)', points: this.points().map(point => ({ x: new Date(point.weekStart), y: point.volumeKg })) },
  ]);

  readonly sessionSeries = computed<readonly LineChartSeries[]>(() => [
    { label: 'Sesiones', points: this.points().map(point => ({ x: new Date(point.weekStart), y: point.sessions })) },
  ]);
}
