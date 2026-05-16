import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { WorkedSet } from '../../domain/worked-set';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

@Component({
  selector: 'fg-pr-celebration',
  standalone: true,
  imports: [DisplayWeightPipe],
  template: `
    @if (visible && set) {
      <div
        class="pr-celebration"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        (click)="onDismiss()"
        (keyup.escape)="onDismiss()"
      >
        <div class="pr-celebration__content">
          <div class="pr-celebration__icon">🏆</div>
          <h2 class="pr-celebration__title">¡Nuevo récord personal!</h2>
          <p class="pr-celebration__subtitle">
            @switch (set.type) {
              @case ('weight-reps') {
                {{ set.reps.value }} reps × {{ set.weight.value | displayWeight: unit() }}
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
          </p>
          <p class="pr-celebration__hint">Tocá para cerrar</p>
        </div>
      </div>
    }
  `,
})
export class PrCelebrationComponent {
  @Input() visible = false;
  @Input() set: WorkedSet | null = null;

  /** Preferred weight unit — passed down from the hosting page (D-3, ADR-22). */
  readonly unit = input<PreferredUnit>('kg');

  @Output() dismissed = new EventEmitter<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
