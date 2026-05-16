import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WorkedSet } from '../../domain/worked-set';

@Component({
  selector: 'fg-pr-celebration',
  standalone: true,
  template: `
    @if (visible && set) {
      <div
        class="pr-celebration"
        role="dialog"
        aria-modal="true"
        (click)="onDismiss()"
      >
        <div class="pr-celebration__content">
          <div class="pr-celebration__icon">🏆</div>
          <h2 class="pr-celebration__title">¡Nuevo récord personal!</h2>
          <p class="pr-celebration__subtitle">
            @switch (set.type) {
              @case ('weight-reps') {
                {{ set.reps.value }} reps × {{ set.weight.value }} kg
              }
              @case ('bodyweight-reps') {
                {{ set.reps.value }} reps
                @if (set.extraWeight) {
                  (+ {{ set.extraWeight.value }} kg)
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
  @Output() dismissed = new EventEmitter<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
