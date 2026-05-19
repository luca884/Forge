import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Routine } from '../../domain/routine.entity';
import { FgCardComponent, FgChipComponent, FgIconComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-routine-card',
  standalone: true,
  imports: [FgCardComponent, FgChipComponent, FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-card>
      <button
        type="button"
        class="w-full text-left flex items-start justify-between gap-3"
        [attr.aria-label]="'Abrir rutina ' + routine().name"
        (click)="onClick()"
      >
        <div class="flex-1 min-w-0">
          <div class="t-h3 text-forge-50 truncate">{{ routine().name }}</div>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <fg-chip size="sm">{{ dayLabel() }}</fg-chip>
            @if (routine().isActive) {
              <fg-chip size="sm" [active]="true">Activa</fg-chip>
            }
          </div>
        </div>
        <fg-icon name="chevron-right" [size]="18"></fg-icon>
      </button>
    </fg-card>
  `,
})
export class RoutineCardComponent {
  readonly routine = input.required<Routine>();
  readonly dayCount = input<number>(0);
  readonly cardClick = output<Routine>();

  protected readonly dayLabel = computed(() => {
    const n = this.dayCount();
    return n === 1 ? '1 día' : `${n} días`;
  });

  protected onClick(): void {
    this.cardClick.emit(this.routine());
  }
}
