import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgCardComponent, FgEmptyStateComponent } from '@core/shared/ui';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { ExerciseProgressEntry, ProgressStatus } from '../../../domain/models/exercise-progress-entry.model';

@Component({
  selector: 'fg-exercise-progress-list',
  standalone: true,
  imports: [FgCardComponent, FgEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="exercise-progress-title">
      <h2 id="exercise-progress-title" class="mb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Progreso por ejercicio</h2>
      @if (entries().length === 0) {
        <fg-empty-state icon="dumbbell" title="Todavía no hay progreso comparable" body="Necesitás al menos dos entrenamientos por ejercicio." />
      } @else {
        <fg-card [padding]="0">
          @for (entry of entries(); track entry.exerciseId) {
            <div class="px-3.5 py-2 min-h-12 flex items-center justify-between gap-3 border-b border-line-soft last:border-b-0">
              <div class="min-w-0">
                <div class="text-[15px] leading-5 font-medium text-ink truncate">{{ entry.exerciseName }}</div>
                <div class="font-mono tabular-nums text-xs leading-4 text-ink-2">{{ formatValue(entry.firstValue, entry.unitLabel) }} → {{ formatValue(entry.latestValue, entry.unitLabel) }}</div>
              </div>
              <div class="text-right">
                <div [class]="deltaClass(entry.deltaPct)">{{ formatDelta(entry.deltaPct) }}</div>
                <span [class]="statusClass(entry.status)">{{ statusLabel(entry.status) }}</span>
              </div>
            </div>
          }
        </fg-card>
      }
    </section>
  `,
})
export class ExerciseProgressListComponent {
  private readonly displayWeight = new DisplayWeightPipe();

  readonly entries = input.required<readonly ExerciseProgressEntry[]>();
  /** Preferred weight unit: entries with unitLabel 'kg' arrive in kg. */
  readonly unit = input<PreferredUnit>('kg');

  formatValue(value: number, unitLabel: string): string {
    const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
    if (unitLabel === 'kg') return this.displayWeight.transform(rounded, this.unit());
    return `${rounded} ${unitLabel}`;
  }

  formatDelta(delta: number | null): string {
    if (delta === null) return '—';
    return `${delta > 0 ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(1)}%`;
  }

  statusClass(status: ProgressStatus): string {
    return `status-${status} text-xs leading-4 ${status === 'improving' ? 'text-accent-ink' : 'text-ink-2'}`;
  }

  statusLabel(status: ProgressStatus): string {
    return status === 'improving' ? 'Mejora' : status === 'stable' ? 'Estable' : 'Sin progreso';
  }

  protected deltaClass(delta: number | null): string {
    const tone = delta === null || delta === 0 ? 'text-ink-2' : delta > 0 ? 'text-accent-ink' : 'text-danger';
    return `font-mono tabular-nums text-[13px] leading-[18px] font-medium ${tone}`;
  }
}
