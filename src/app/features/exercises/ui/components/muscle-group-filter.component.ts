import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MuscleGroup } from '../../domain/exercise.entity';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';

const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
  'full-body',
];

/**
 * Filtro por grupo muscular del lenguaje C: fila de píldoras "Todos" + 9 grupos.
 * Son <button aria-pressed> nativos (enfocables y operables con teclado); el
 * activo va en acento sólido con texto `accent-on`, como en C-Library.
 * Emite el grupo tocado, o `undefined` para "Todos"; quien lo usa decide si un
 * segundo toque sobre el mismo grupo lo apaga.
 */
@Component({
  selector: 'fg-muscle-group-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      aria-label="Filtrar por grupo muscular"
      class="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1"
    >
      <button
        type="button"
        class="shrink-0 h-[34px] px-3 rounded-full border text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent"
        [class]="pillClasses(selected() === undefined)"
        [attr.aria-pressed]="selected() === undefined"
        (click)="pick.emit(undefined)"
      >Todos</button>
      @for (group of groups; track group) {
        <button
          type="button"
          class="shrink-0 h-[34px] px-3 rounded-full border text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent"
          [class]="pillClasses(selected() === group)"
          [attr.aria-pressed]="selected() === group"
          (click)="pick.emit(group)"
        >{{ label(group) }}</button>
      }
    </div>
  `,
})
export class MuscleGroupFilterComponent {
  readonly selected = input<MuscleGroup | undefined>(undefined);
  readonly pick = output<MuscleGroup | undefined>();

  protected readonly groups = MUSCLE_GROUPS;
  protected readonly label = muscleGroupLabel;

  protected pillClasses(active: boolean): string {
    return active
      ? 'bg-accent text-accent-on border-accent'
      : 'bg-surface text-ink border-line';
  }
}
