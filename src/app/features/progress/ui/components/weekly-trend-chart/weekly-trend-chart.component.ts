import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FgCardComponent, FgEmptyStateComponent } from '@core/shared/ui';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { WeeklyTrendPoint } from '../../../domain/models/weekly-trend-point.model';
import { displayWeightValue } from '../../helpers/weight-display';

export interface WeekBar {
  readonly label: string;
  /** Bar height as a percentage of the axis maximum. */
  readonly heightPct: number;
  /** The week still in progress: drawn lighter, it is not comparable with a full week. */
  readonly current: boolean;
}

export interface WeekBarChart {
  /** Axis ticks top to bottom: maximum, middle, zero. */
  readonly ticks: readonly number[];
  readonly bars: readonly WeekBar[];
  readonly ariaLabel: string;
}

/** Round axis maxima, so the ticks read 40000 / 20000 / 0 and not 38300 / 19150 / 0. */
const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function niceMax(value: number): number {
  // No data yet: an empty 10 / 5 / 0 axis reads better than 1 / 0.5 / 0.
  if (value <= 0) return 10;
  const exp = 10 ** Math.floor(Math.log10(value));
  const factor = NICE_STEPS.find((step) => step * exp >= value - 1e-9) ?? 10;
  return factor * exp;
}

function axisMax(value: number, wholeNumbers: boolean): number {
  const max = niceMax(value);
  // Whole-number axes (sessions) need an even maximum so the middle tick is whole too.
  return wholeNumbers ? Math.max(2, 2 * Math.ceil(max / 2)) : max;
}

/** 'YYYY-MM-DD' → 'd/m' (no leading zeros, like the Cuaderno board). */
function shortWeek(weekStart: string): string {
  const [, month, day] = weekStart.split('-');
  return `${Number(day)}/${Number(month)}`;
}

function buildChart(
  points: readonly WeeklyTrendPoint[],
  values: readonly number[],
  wholeNumbers: boolean,
  describe: (min: number, max: number, current: number | null) => string,
): WeekBarChart {
  const max = axisMax(Math.max(0, ...values), wholeNumbers);
  const now = Date.now();
  const bars = points.map((point, i): WeekBar => ({
    label: i % 3 === 0 || i === points.length - 1 ? shortWeek(point.weekStart) : '',
    heightPct: Math.round(((values[i] ?? 0) / max) * 1000) / 10,
    current: now - new Date(`${point.weekStart}T00:00:00`).getTime() < WEEK_MS,
  }));
  const last = bars[bars.length - 1];
  const full = values.filter((_, i) => !bars[i]?.current);
  const range = full.length > 0 ? full : values;
  return {
    ticks: [max, max / 2, 0],
    bars,
    ariaLabel: describe(Math.min(...range), Math.max(...range), last?.current ? (values[values.length - 1] ?? null) : null),
  };
}

@Component({
  selector: 'fg-weekly-trend-chart',
  standalone: true,
  imports: [FgCardComponent, FgEmptyStateComponent, DisplayWeightPipe, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="weekly-volume-title">
      @if (points().length === 0) {
        <h2 id="weekly-volume-title" class="mb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Volumen semanal</h2>
        <fg-empty-state icon="calendar" title="Todavía no hay volumen semanal" />
      } @else {
        <fg-card [padding]="0">
          <div class="px-3.5 pt-3 pb-2.5 flex flex-col gap-2">
            <div class="flex items-baseline justify-between gap-2">
              <h2 id="weekly-volume-title" class="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Volumen semanal</h2>
              <span class="font-mono tabular-nums text-xs text-ink">promedio {{ averageVolumeKg() | displayWeight: unit() }}</span>
            </div>
            <ng-container *ngTemplateOutlet="bars; context: { chart: volumeChart() }" />
          </div>
          <div class="px-3.5 pt-2.5 pb-2.5 border-t border-line-soft flex flex-col gap-2">
            <h2 class="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Sesiones semanales</h2>
            <ng-container *ngTemplateOutlet="bars; context: { chart: sessionChart() }" />
          </div>
        </fg-card>
      }
    </section>

    <ng-template #bars let-chart="chart">
      <div role="img" [attr.aria-label]="chart.ariaLabel" class="grid grid-cols-[44px_minmax(0,1fr)] gap-x-1.5">
        <div class="flex flex-col justify-between h-[112px] -mt-[5px] mb-[5px] font-mono text-[10px] leading-[10px] text-ink-2 text-right">
          @for (tick of chart.ticks; track $index) {
            <span>{{ tick }}</span>
          }
        </div>
        <div class="relative h-[102px] border-b border-ink">
          <span class="absolute inset-x-0 top-0 border-t border-dashed border-line"></span>
          <span class="absolute inset-x-0 top-[51px] border-t border-dashed border-line"></span>
          <div class="absolute inset-0 grid grid-flow-col auto-cols-fr items-end gap-x-1.5">
            @for (bar of chart.bars; track $index) {
              <span
                data-bar
                class="block rounded-t-sm"
                [class]="bar.current ? 'bg-accent/40' : 'bg-accent'"
                [style.height.%]="bar.heightPct"
              ></span>
            }
          </div>
        </div>
        <span></span>
        <div class="grid grid-flow-col auto-cols-fr gap-x-1.5 font-mono text-[10px] leading-[14px] text-ink-2 pt-1">
          @for (bar of chart.bars; track $index) {
            <span class="text-center whitespace-nowrap overflow-visible">{{ bar.label }}</span>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class WeeklyTrendChartComponent {
  readonly points = input.required<readonly WeeklyTrendPoint[]>();
  /** Preferred weight unit: volume is stored in kg and shown in this unit. */
  readonly unit = input<PreferredUnit>('kg');

  readonly volumeChart = computed<WeekBarChart>(() => {
    const unit = this.unit();
    const values = this.points().map((p) => displayWeightValue(p.volumeKg, unit));
    return buildChart(this.points(), values, false, (min, max, current) => {
      const base = `Volumen semanal de las últimas ${values.length} semanas, entre ${min} y ${max} ${unit}`;
      return current === null ? base : `${base}; semana en curso ${current} ${unit}`;
    });
  });

  readonly sessionChart = computed<WeekBarChart>(() => {
    const values = this.points().map((p) => p.sessions);
    return buildChart(this.points(), values, true, (min, max, current) => {
      const base = `Sesiones semanales de las últimas ${values.length} semanas, entre ${min} y ${max}`;
      return current === null ? base : `${base}; semana en curso ${current}`;
    });
  });

  /** Average weekly volume in kg (rounded); the template formats it with the preferred unit. */
  readonly averageVolumeKg = computed<number>(() => {
    const points = this.points();
    if (points.length === 0) return 0;
    return Math.round(points.reduce((sum, p) => sum + p.volumeKg, 0) / points.length);
  });
}
