import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgCardComponent, FgSkeletonComponent } from '@core/shared/ui';
import type { DashboardOverview } from '../../../domain/models/dashboard-overview.model';

@Component({
  selector: 'fg-dashboard-overview',
  standalone: true,
  imports: [FgCardComponent, FgSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Últimos 30 días">
      <div class="t-micro text-forge-500 mb-2">ÚLTIMOS 30 DÍAS</div>
      @if (loading() || overview() === null) {
        <div class="grid grid-cols-3 gap-3">
          @for (_ of [1, 2, 3]; track $index) {
            <fg-card><fg-skeleton [height]="48" /></fg-card>
          }
        </div>
      } @else {
        <div class="grid grid-cols-3 gap-3">
          <fg-card><div class="t-h3 text-forge-50 tabular-nums">{{ overview()!.sessionsCurrent }}</div><div class="t-caption text-forge-500 mt-1">Sesiones</div><span [class]="deltaClass(overview()!.sessionsDeltaPct)">{{ formatDelta(overview()!.sessionsDeltaPct) }}</span></fg-card>
          <fg-card><div class="t-h3 text-forge-50 tabular-nums">{{ overview()!.setsCurrent }}</div><div class="t-caption text-forge-500 mt-1">Sets</div><span [class]="deltaClass(overview()!.setsDeltaPct)">{{ formatDelta(overview()!.setsDeltaPct) }}</span></fg-card>
          <fg-card><div class="t-h3 text-forge-50 tabular-nums">{{ overview()!.volumeCurrentKg }}</div><div class="t-caption text-forge-500 mt-1">Volumen kg</div><span [class]="deltaClass(overview()!.volumeDeltaPct)">{{ formatDelta(overview()!.volumeDeltaPct) }}</span></fg-card>
        </div>
      }
    </section>
  `,
})
export class DashboardOverviewComponent {
  readonly overview = input<DashboardOverview | null>(null);
  readonly loading = input(false);

  formatDelta(delta: number | null): string {
    if (delta === null) return '—';
    return `${delta > 0 ? '+' : ''}${formatNumber(delta)}%`;
  }

  deltaClass(delta: number | null): string {
    if (delta === null) return 'delta-neutral t-caption text-forge-500';
    if (delta > 0) return 'delta-positive t-caption text-accent-300';
    if (delta < 0) return 'delta-negative t-caption text-danger';
    return 'delta-neutral t-caption text-forge-400';
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
