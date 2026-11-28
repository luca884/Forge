import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FgButtonComponent, FgCardComponent, FgPageHeaderComponent } from '@core/shared/ui';
import type { HealthDay } from '../../domain/health-day.entity';
import { HealthSource } from '../../domain/health-source';
import { localDayId } from '../../domain/local-day';
import type { HealthTrend } from '../../domain/health-trend';
import { GetHealthTrendUseCase } from '../../domain/use-cases/get-health-trend.use-case';
import { GetHealthDayUseCase } from '../../domain/use-cases/get-health-day.use-case';
import { SyncHealthUseCase, type SyncHealthResult } from '../../domain/use-cases/sync-health.use-case';
import { FgTrendChartComponent } from '../components/trend-chart.component';
import { formatBpm, formatKcal, formatMeters, formatPercent, formatSteps } from '../format/health-format';

/** Primera sincronización (hoy sin datos) lee un mes; las siguientes solo la última semana. */
const FIRST_SYNC_DAYS = 30;
const REGULAR_SYNC_DAYS = 7;

type TrendRange = 7 | 30;
const TREND_RANGES: readonly TrendRange[] = [7, 30];

function syncMessage(result: SyncHealthResult): string {
  switch (result.status) {
    case 'unavailable':
      return 'Health Connect no está disponible en este dispositivo.';
    case 'denied':
      return 'No diste permiso para leer Health Connect. Podés dárselo desde los permisos de la app.';
    case 'synced':
      if (result.days === 0) return 'No hay datos nuevos en Health Connect.';
      return `Sincronizado: ${result.days} ${result.days === 1 ? 'día' : 'días'}.`;
  }
}

@Component({
  selector: 'fg-health-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FgButtonComponent, FgCardComponent, FgPageHeaderComponent, FgTrendChartComponent],
  template: `
    <fg-page-header title="Salud" />

    <div class="flex flex-col gap-3 px-4 pt-3 pb-6">
      @if (loadError()) {
        <p role="alert" class="text-sm text-danger">No se pudieron cargar los datos de salud.</p>
      } @else if (loaded()) {
        @let day = today();
        <fg-card>
          <h2 class="font-semibold text-ink">Hoy</h2>
          <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div>
              <dt class="text-xs text-ink-2">Pasos</dt>
              <dd class="font-mono text-ink">{{ steps(day?.steps ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Distancia</dt>
              <dd class="font-mono text-ink">{{ meters(day?.distanceMeters ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Calorías</dt>
              <dd class="font-mono text-ink">{{ kcal(day?.caloriesKcal ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Frecuencia cardíaca</dt>
              <dd class="font-mono text-ink">{{ bpm(day?.heartRate?.avg ?? null) }}</dd>
              @if (day?.heartRate; as heartRate) {
                <dd class="font-mono text-xs text-ink-2">{{ heartRate.min }}–{{ heartRate.max }} lpm</dd>
              }
            </div>
            <div>
              <dt class="text-xs text-ink-2">Saturación de oxígeno</dt>
              <dd class="font-mono text-ink">{{ percent(day?.oxygenSaturation?.avg ?? null) }}</dd>
            </div>
          </dl>
          @if (!day) {
            <p class="mt-3 text-sm text-ink-2">Todavía no hay datos de hoy.</p>
          }
        </fg-card>
      } @else {
        <p role="status" class="text-sm text-ink-2">Cargando datos de salud…</p>
      }

      @if (trendError()) {
        <p role="alert" class="text-sm text-danger">No se pudo cargar la tendencia.</p>
      } @else {
        @if (trend(); as data) {
        <section class="flex flex-col gap-3" aria-labelledby="trend-title">
          <div class="flex items-center justify-between">
            <h2 id="trend-title" class="font-semibold text-ink">Tendencia</h2>
            <div class="flex gap-2">
              @for (option of ranges; track option) {
                <button
                  type="button"
                  fg-button
                  size="sm"
                  [variant]="option === range() ? 'primary' : 'secondary'"
                  [attr.aria-pressed]="option === range()"
                  (click)="onRange(option)"
                >
                  {{ option }} días
                </button>
              }
            </div>
          </div>
          @for (metric of metrics(data); track metric.title) {
            <fg-card>
              <h3 class="text-sm font-medium text-ink">{{ metric.title }}</h3>
              @if (data.summary.daysWithData > 0 && metric.average !== null) {
                <p class="text-xs text-ink-2">Promedio: {{ metric.average }}</p>
                <fg-trend-chart [values]="metric.values" [kind]="metric.kind" [label]="metric.label + ', últimos ' + range() + ' días'" />
              } @else {
                <p class="text-xs text-ink-2">Sin datos en este período</p>
              }
            </fg-card>
          }
        </section>
        }
      }

      @if (canSync()) {
        <button type="button" fg-button class="self-start" [disabled]="syncing()" (click)="onSync()">
          Sincronizar con Health Connect
        </button>
      } @else if (sourceChecked()) {
        <p class="text-sm text-ink-2">
          Leer datos nuevos solo funciona en la app de Android con Health Connect. Acá ves los datos ya guardados.
        </p>
      }
      @if (syncError()) {
        <p role="alert" class="text-sm text-danger">No se pudo sincronizar. Probá de nuevo.</p>
      } @else {
        @if (syncResult(); as message) {
          <p role="status" class="text-sm text-ink-2">{{ message }}</p>
        }
      }
    </div>
  `,
})
export class HealthPage implements OnInit {
  private readonly getDay = inject(GetHealthDayUseCase);
  private readonly getTrend = inject(GetHealthTrendUseCase);
  private readonly syncHealth = inject(SyncHealthUseCase);
  private readonly source = inject(HealthSource);

  protected readonly today = signal<HealthDay | null>(null);
  protected readonly loaded = signal(false);
  protected readonly loadError = signal(false);
  protected readonly sourceChecked = signal(false);
  protected readonly canSync = signal(false);
  protected readonly syncing = signal(false);
  protected readonly syncResult = signal<string | null>(null);
  protected readonly syncError = signal(false);
  protected readonly range = signal<TrendRange>(7);
  protected readonly trend = signal<HealthTrend | null>(null);
  protected readonly trendError = signal(false);
  protected readonly ranges = TREND_RANGES;

  protected readonly steps = formatSteps;
  protected readonly meters = formatMeters;
  protected readonly kcal = formatKcal;
  protected readonly bpm = formatBpm;
  protected readonly percent = formatPercent;

  ngOnInit(): void {
    void this.load();
    void this.loadTrend();
    void this.checkSource();
  }

  protected onRange(range: TrendRange): void {
    if (range === this.range()) return;
    this.range.set(range);
    void this.loadTrend();
  }

  /** Una tarjeta por medida; el promedio ya viene formateado y con su unidad. */
  protected metrics(data: HealthTrend) {
    const { summary, points } = data;
    return [
      {
        title: 'Pasos',
        label: 'Pasos por día',
        kind: 'bars' as const,
        values: points.map((p) => p.steps),
        average: summary.stepsAvg === null ? null : `${formatSteps(summary.stepsAvg)} pasos por día`,
      },
      {
        title: 'Frecuencia cardíaca',
        label: 'Frecuencia cardíaca promedio por día',
        kind: 'line' as const,
        values: points.map((p) => p.heartRateAvg),
        average: summary.heartRateAvg === null ? null : formatBpm(summary.heartRateAvg),
      },
      {
        title: 'Saturación de oxígeno',
        label: 'Saturación de oxígeno promedio por día',
        kind: 'line' as const,
        values: points.map((p) => p.oxygenSaturationAvg),
        average: summary.oxygenSaturationAvg === null ? null : formatPercent(summary.oxygenSaturationAvg),
      },
    ];
  }

  protected async onSync(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncError.set(false);
    this.syncResult.set(null);
    try {
      const days = this.today() ? REGULAR_SYNC_DAYS : FIRST_SYNC_DAYS;
      const result = await this.syncHealth.execute({ now: new Date(), days });
      this.syncResult.set(syncMessage(result));
      if (result.status === 'synced') await Promise.all([this.load(), this.loadTrend()]);
    } catch {
      this.syncError.set(true);
    } finally {
      this.syncing.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.today.set(await this.getDay.execute(localDayId(new Date())));
      this.loadError.set(false);
      this.loaded.set(true);
    } catch {
      this.loadError.set(true);
    }
  }

  private async loadTrend(): Promise<void> {
    const range = this.range();
    try {
      const trend = await this.getTrend.execute(localDayId(new Date()), range);
      if (range !== this.range()) return; // llegó tarde: el usuario ya cambió de período
      this.trend.set(trend);
      this.trendError.set(false);
    } catch {
      this.trendError.set(true);
    }
  }

  private async checkSource(): Promise<void> {
    try {
      this.canSync.set(await this.source.isAvailable());
    } catch {
      this.canSync.set(false);
    }
    this.sourceChecked.set(true);
  }
}
