/**
 * PrCelebrationComponent (D-3).
 * Lenguaje Cuaderno: el récord usa el color de acento elegido (texto `accent-ink`,
 * borde `accent`, ícono sobre `accent` sólido). Ya no usa el naranja propio de los récords.
 */
import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { WorkedSet } from '../../domain/worked-set';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { FgIconComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-pr-celebration',
  standalone: true,
  imports: [DisplayWeightPipe, FgIconComponent],
  template: `
    @if (visible && set) {
      <div class="bg-surface border border-accent rounded-xl p-3.5 relative overflow-hidden flex gap-3 items-center">
        <!-- Accent wash -->
        <div class="absolute inset-0 pointer-events-none bg-accent-soft"></div>

        <!-- Flame icon square -->
        <div class="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center relative bg-accent text-accent-on">
          <fg-icon name="flame" [size]="20"></fg-icon>
        </div>

        <!-- Body -->
        <div class="flex-1 min-w-0 relative">
          <div class="text-[13px] leading-[18px] font-semibold text-accent-ink">
            NUEVO PR{{ delta() ? ' · ' + delta() : '' }}
          </div>
          <div class="text-[15px] leading-5 font-medium text-ink mt-0.5">{{ exerciseName() }}</div>
          <div class="font-mono tabular-nums text-[13px] leading-[18px] text-ink-2 mt-0.5">
            @switch (set.type) {
              @case ('weight-reps') {
                {{ set.weight.value | displayWeight: unit() }} · {{ set.reps.value }} reps
              }
              @case ('bodyweight-reps') {
                {{ set.reps.value }} reps
                @if (set.extraWeight) {
                  (+ {{ set.extraWeight.value | displayWeight: unit() }})
                }
              }
              @default {
                ¡Excelente trabajo!
              }
            }
          </div>
        </div>

        <!-- Dismiss button -->
        <button type="button"
                (click)="onDismiss()"
                class="text-ink-2 relative flex-shrink-0"
                aria-label="Cerrar">
          <fg-icon name="x" [size]="16"></fg-icon>
        </button>
      </div>
    }
  `,
})
export class PrCelebrationComponent {
  @Input() visible = false;
  @Input() set: WorkedSet | null = null;

  /** Preferred weight unit — passed down from the hosting page (D-3, ADR-22). */
  readonly unit = input<PreferredUnit>('kg');

  /** Exercise name to display in the banner. */
  readonly exerciseName = input<string>('');

  /** Delta string, e.g. '+5 kg' — optional, provided by the host if context is available. */
  readonly delta = input<string | null>(null);

  @Output() dismissed = new EventEmitter<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
