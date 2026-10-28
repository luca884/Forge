import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgCardComponent, FgSkeletonComponent } from '@core/shared/ui';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { DashboardOverview } from '../../../domain/models/dashboard-overview.model';

@Component({
  selector: 'fg-dashboard-overview',
  standalone: true,
  imports: [FgCardComponent, FgSkeletonComponent, DisplayWeightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="overview-title">
      <h2 id="overview-title" class="mb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Últimos 30 días</h2>
      @if (loading() || overview() === null) {
        <div class="grid grid-cols-3 gap-3">
          @for (_ of [1, 2, 3]; track $index) {
            <fg-card><fg-skeleton [height]="48" /></fg-card>
          }
        </div>
      } @else {
        <fg-card [padding]="0">
          <div class="grid grid-cols-3">
            <div class="flex flex-col gap-1 p-3 border-r border-line-soft">
              <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Sesiones</span>
              <span class="font-mono tabular-nums text-lg font-medium text-ink">{{ overview()!.sessionsCurrent }}</span>
              <span [class]="deltaClass(overview()!.sessionsDeltaPct)">{{ formatDelta(overview()!.sessionsDeltaPct) }}</span>
            </div>
            <div class="flex flex-col gap-1 p-3 border-r border-line-soft">
              <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Series</span>
              <span class="font-mono tabular-nums text-lg font-medium text-ink">{{ overview()!.setsCurrent }}</span>
              <span [class]="deltaClass(overview()!.setsDeltaPct)">{{ formatDelta(overview()!.setsDeltaPct) }}</span>
            </div>
            <div class="flex flex-col gap-1 p-3">
              <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Volumen</span>
              <span class="font-mono tabular-nums text-lg font-medium text-ink">{{ overview()!.volumeCurrentKg | displayWeight: unit() }}</span>
              <span [class]="deltaClass(overview()!.volumeDeltaPct)">{{ formatDelta(overview()!.volumeDeltaPct) }}</span>
            </div>
          </div>
        </fg-card>
      }
    </section>
  `,
})
export class DashboardOverviewComponent {
  readonly overview = input<DashboardOverview | null>(null);
  readonly loading = input(false);
  /** Preferred weight unit: the volume arrives in kg. */
  readonly unit = input<PreferredUnit>('kg');

  formatDelta(delta: number | null): string {
    if (delta === null) return '—';
    return `${delta > 0 ? '+' : ''}${formatNumber(delta)}%`;
  }

  deltaClass(delta: number | null): string {
    if (delta === null) return 'delta-neutral font-mono text-xs text-ink-2';
    if (delta > 0) return 'delta-positive font-mono text-xs text-accent-ink';
    if (delta < 0) return 'delta-negative font-mono text-xs text-danger';
    return 'delta-neutral font-mono text-xs text-ink-2';
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
