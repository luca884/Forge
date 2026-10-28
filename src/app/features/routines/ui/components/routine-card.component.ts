import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Routine } from '../../domain/routine.entity';
import { TrainingDay } from '../../domain/training-day.entity';
import { DAYS_OF_WEEK, DayOfWeek } from '../../domain/value-objects/weekly-schedule';
import { FgButtonComponent, FgIconComponent } from '@core/shared/ui';

interface WeekCell {
  readonly dow: DayOfWeek;
  /** "LUN", "MAR"… */
  readonly label: string;
  /** Sigla del día entrenado ("TA"), o null en descanso. */
  readonly code: string | null;
  readonly isToday: boolean;
}

interface DayRow {
  readonly day: TrainingDay;
  readonly code: string;
  readonly exercises: number;
  readonly sets: number;
  /** Se entrena hoy según el horario semanal. */
  readonly isToday: boolean;
}

const DOW_SHORT: Record<DayOfWeek, string> = {
  monday: 'LUN',
  tuesday: 'MAR',
  wednesday: 'MIÉ',
  thursday: 'JUE',
  friday: 'VIE',
  saturday: 'SÁB',
  sunday: 'DOM',
};

// Index = Date.getDay() (0 = domingo).
const DOW_BY_JS_DAY: readonly DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function currentDow(): DayOfWeek {
  return DOW_BY_JS_DAY[new Date().getDay()] as DayOfWeek;
}

/** "Torso A" -> "TA", "Día 1" -> "D1", "Piernas" -> "PI". */
function dayCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const code = words.length > 1 ? first.charAt(0) + (words[1] ?? '').charAt(0) : first.slice(0, 2);
  return code.toUpperCase();
}

function pluralDays(n: number): string {
  return n === 1 ? '1 día' : `${n} días`;
}

@Component({
  selector: 'fg-routine-card',
  standalone: true,
  imports: [FgButtonComponent, FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (routine().isActive) {
      <section
        data-active-routine
        class="bg-surface border border-line rounded-lg flex flex-col"
        [attr.aria-label]="routine().name"
      >
        <div class="flex items-start justify-between gap-2 px-4 pt-3.5 pb-2.5">
          <button
            type="button"
            class="flex-1 min-w-0 text-left flex flex-col gap-0.5"
            [attr.aria-label]="'Abrir rutina ' + routine().name"
            (click)="onClick()"
          >
            <span
              data-active-label
              class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-accent-ink"
            >Activa</span>
            <span class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink truncate">{{ routine().name }}</span>
            <span class="font-mono text-[12px] leading-4 text-ink-2">{{ summary() }}</span>
          </button>
          <button fg-button variant="secondary" size="sm" type="button" (click)="editWeek.emit(routine())">
            Editar semana
          </button>
        </div>

        <div
          data-week-strip
          role="list"
          aria-label="Semana de la rutina"
          class="grid grid-cols-7 mx-3 mb-3 border border-line-soft rounded-lg overflow-hidden"
        >
          @for (cell of weekCells(); track cell.dow) {
            <div
              role="listitem"
              class="flex flex-col items-center gap-0.5 py-1.5 border-r border-line-soft last:border-r-0"
              [class.bg-accent-soft]="cell.isToday"
              [attr.data-today]="cell.isToday ? '' : null"
            >
              <span
                class="text-[10px] font-semibold tracking-[0.06em]"
                [class.text-ink-2]="!cell.isToday"
                [class.text-accent-ink]="cell.isToday"
              >{{ cell.label }}</span>
              <span
                class="font-mono text-[12px]"
                [class.font-medium]="cell.code !== null"
                [class.text-ink-2]="cell.code === null && !cell.isToday"
                [class.text-accent-ink]="cell.isToday"
              >{{ cell.code ?? '—' }}</span>
            </div>
          }
        </div>

        @if (dayRows().length > 0) {
          <div
            class="grid grid-cols-[28px_minmax(0,1fr)_80px_48px_20px] gap-x-2 px-4 pb-1.5 text-[10px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2 border-b border-line"
            aria-hidden="true"
          >
            <span></span><span>Día</span><span>Ejercicios</span><span>Series</span><span></span>
          </div>
          @for (row of dayRows(); track row.day.id) {
            <button
              type="button"
              data-day-row
              class="grid grid-cols-[28px_minmax(0,1fr)_80px_48px_20px] gap-x-2 items-center min-h-[46px] px-4 text-left text-ink border-b border-line-soft last:border-b-0"
              [attr.aria-label]="'Editar día ' + row.day.name"
              (click)="dayClick.emit(row.day)"
            >
              <span
                class="font-mono text-[12px]"
                [class.text-ink-2]="!row.isToday"
                [class.text-accent-ink]="row.isToday"
              >{{ row.code }}</span>
              <span class="text-[15px] font-medium truncate">{{ row.day.name }}</span>
              <span class="font-mono text-[13px]">{{ row.exercises }}</span>
              <span class="font-mono text-[13px]">{{ row.sets }}</span>
              <fg-icon name="chevron-right" [size]="16" class="text-ink-2"></fg-icon>
            </button>
          }
        }
      </section>
    } @else {
      <div class="flex items-center justify-between gap-2 min-h-[52px] pl-4 pr-2">
        <button
          type="button"
          class="flex-1 min-w-0 text-left flex flex-col py-2"
          [attr.aria-label]="'Abrir rutina ' + routine().name"
          (click)="onClick()"
        >
          <span class="text-[15px] font-medium text-ink truncate">{{ routine().name }}</span>
          <span class="font-mono text-[12px] text-ink-2">{{ dayLabel() }}</span>
        </button>
        <button
          type="button"
          class="h-9 px-3 rounded-lg text-[13px] font-semibold text-accent-ink"
          [attr.aria-label]="'Activar rutina ' + routine().name"
          (click)="activate.emit(routine())"
        >Activar</button>
      </div>
    }
  `,
})
export class RoutineCardComponent {
  readonly routine = input.required<Routine>();
  readonly dayCount = input<number>(0);
  /** Días de la rutina; solo la rutina activa los dibuja (semana y tabla). */
  readonly days = input<readonly TrainingDay[]>([]);
  /** Día de la semana que se resalta como "hoy". Por defecto, el de la fecha actual. */
  readonly todayDow = input<DayOfWeek>(currentDow());

  readonly cardClick = output<Routine>();
  readonly activate = output<Routine>();
  readonly editWeek = output<Routine>();
  readonly dayClick = output<TrainingDay>();

  protected readonly dayLabel = computed(() => pluralDays(this.dayCount()));

  private readonly scheduledCount = computed(() => {
    const schedule = this.routine().schedule;
    if (!schedule) return 0;
    return DAYS_OF_WEEK.filter((dow) => schedule[dow] !== undefined).length;
  });

  protected readonly summary = computed(() => {
    const days = pluralDays(this.dayCount());
    const sessions = this.scheduledCount();
    if (sessions === 0) return days;
    return `${days} · ${sessions === 1 ? '1 sesión' : `${sessions} sesiones`} por semana`;
  });

  protected readonly weekCells = computed<readonly WeekCell[]>(() => {
    const schedule = this.routine().schedule;
    const byId = new Map(this.days().map((d) => [d.id, d] as const));
    const today = this.todayDow();
    return DAYS_OF_WEEK.map((dow) => {
      const dayId = schedule?.[dow];
      const day = dayId !== undefined ? byId.get(dayId) : undefined;
      return {
        dow,
        label: DOW_SHORT[dow],
        code: day ? dayCode(day.name) : null,
        isToday: dow === today,
      };
    });
  });

  protected readonly dayRows = computed<readonly DayRow[]>(() => {
    const todayId = this.routine().schedule?.[this.todayDow()];
    return this.days().map((day) => ({
      day,
      code: dayCode(day.name),
      exercises: day.exercises.length,
      sets: day.exercises.reduce((total, e) => total + e.targetSets.length, 0),
      isToday: todayId !== undefined && todayId === day.id,
    }));
  });

  protected onClick(): void {
    this.cardClick.emit(this.routine());
  }
}
