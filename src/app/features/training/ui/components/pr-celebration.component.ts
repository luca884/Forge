/**
 * PrCelebrationComponent (D-3).
 * ADR-33 INVARIANT: ZERO accent tokens allowed. Only --pr-warm, --pr-warm-rgb, --pr-warm-text.
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
      <div class="bg-forge-850 rounded-[14px] p-4 relative overflow-hidden flex gap-3.5 items-center"
           style="box-shadow: inset 0 0 0 1px rgb(var(--pr-warm-rgb) / 0.4), 0 16px 40px rgb(var(--pr-warm-rgb) / 0.15);">
        <!-- Radial gradient overlay -->
        <div class="absolute inset-0 pointer-events-none"
             style="background: radial-gradient(120% 80% at 0% 50%, rgb(var(--pr-warm-rgb) / 0.2), transparent 65%);"></div>

        <!-- Flame icon circle -->
        <div class="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center relative"
             style="background: var(--pr-warm); box-shadow: 0 0 24px rgb(var(--pr-warm-rgb) / 0.45), inset 0 0 0 1px rgba(255,255,255,0.2);">
          <fg-icon name="flame" [size]="26" class="text-white"></fg-icon>
        </div>

        <!-- Body -->
        <div class="flex-1 min-w-0 relative">
          <div class="t-micro" style="color: var(--pr-warm-text); letter-spacing: 0.08em;">
            NUEVO PR{{ delta() ? ' · ' + delta() : '' }}
          </div>
          <div class="t-h3 text-forge-50 mt-0.5">{{ exerciseName() }}</div>
          <div class="t-body-sm text-forge-200 mt-0.5 tabular-nums">
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
                class="text-forge-500 hover:text-forge-300 relative flex-shrink-0"
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
