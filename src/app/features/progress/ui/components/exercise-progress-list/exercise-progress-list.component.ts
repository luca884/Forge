import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgCardComponent, FgEmptyStateComponent } from '@core/shared/ui';
import type { ExerciseProgressEntry, ProgressStatus } from '../../../domain/models/exercise-progress-entry.model';

@Component({
  selector: 'fg-exercise-progress-list',
  standalone: true,
  imports: [FgCardComponent, FgEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="t-micro text-forge-500 mb-2">PROGRESO POR EJERCICIO</div>
      @if (entries().length === 0) {
        <fg-empty-state icon="dumbbell" title="Todavía no hay progreso comparable" body="Necesitás al menos dos entrenamientos por ejercicio." />
      } @else {
        <fg-card [padding]="0">
          @for (entry of entries(); track entry.exerciseId) {
            <div class="px-4 py-3 flex items-center justify-between border-b border-forge-800 last:border-b-0">
              <div>
                <div class="t-body text-forge-100">{{ entry.exerciseName }}</div>
                <div class="t-caption text-forge-500">{{ formatValue(entry.firstValue, entry.unitLabel) }} → {{ formatValue(entry.latestValue, entry.unitLabel) }}</div>
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
  readonly entries = input.required<readonly ExerciseProgressEntry[]>();

  formatValue(value: number, unitLabel: string): string {
    return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unitLabel}`;
  }

  formatDelta(delta: number | null): string {
    if (delta === null) return '—';
    return `${delta > 0 ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(1)}%`;
  }

  statusClass(status: ProgressStatus): string {
    return `status-${status} t-caption ${status === 'improving' ? 'text-accent-300' : status === 'stable' ? 'text-forge-400' : 'text-forge-500'}`;
  }

  statusLabel(status: ProgressStatus): string {
    return status === 'improving' ? 'Mejora' : status === 'stable' ? 'Estable' : 'Sin progreso';
  }

  protected deltaClass(delta: number | null): string {
    if (delta === null) return 't-caption text-forge-500';
    return delta > 0 ? 't-caption text-accent-300' : delta < 0 ? 't-caption text-danger' : 't-caption text-forge-400';
  }
}
