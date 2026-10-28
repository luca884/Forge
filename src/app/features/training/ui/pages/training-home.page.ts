import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Routine } from '../../../routines/domain/routine.entity';
import { TrainingDay } from '../../../routines/domain/training-day.entity';
import { Session } from '../../domain/session.entity';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { StartSessionUseCase } from '../../domain/use-cases/start-session.use-case';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { GetSuggestedDayForTodayUseCase, SuggestedDayResult } from '../../domain/use-cases/get-suggested-day-for-today.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
import { GetLastWorkedSetForExerciseUseCase } from '../../domain/use-cases/get-last-worked-set-for-exercise.use-case';
import { SessionRepository } from '../../domain/session.repository';
import { WorkedSet } from '../../domain/worked-set';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import type { Exercise } from '../../../exercises/domain/exercise.entity';
import { TargetSet } from '../../../routines/domain/target-set';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { loadKg } from '@core/shared/domain/weight-unit';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionAlreadyInProgressError } from '../../domain/errors/session-already-in-progress.error';
import { FgCardComponent, FgButtonComponent, FgIconComponent, ToastService } from '@core/shared/ui';
import { DAYS_OF_WEEK, DayOfWeek } from '../../../routines/domain/value-objects/weekly-schedule';
import { formatPlates } from '../format-plates';
import { FgFirstUseComponent } from '@features/onboarding/ui/components/first-use.component';

// ─── File-local types ─────────────────────────────────────────────────────────

type WeekCellState = 'done' | 'today' | 'planned' | 'rest';

interface WeekCell {
  dow: DayOfWeek;
  /** Short day label: L M M J V S D */
  label: string;
  /** Day of the month, e.g. "27" */
  num: string;
  /** TrainingDay.label for days in schedule, null for rest days */
  dayLabel: string | null;
  isToday: boolean;
  state: WeekCellState;
}

interface PlanRow {
  exerciseId: string;
  /** Zero-padded position in the day: "01", "02"… */
  n: string;
  name: string;
  /** e.g. "4 × 6–8" */
  target: string;
  /** e.g. "100 kg × 7" or "7 placas × 8", or "—" when the exercise was never logged */
  last: string;
}

/** A weight-reps set of a journal session, as stored: its volume depends on the exercise's unit. */
interface JournalLoad {
  exerciseId: string;
  /** Kilograms, or plates on a plates exercise. */
  weight: number;
  reps: number;
}

/** What "Diario" knows about a session, before the unit-dependent text is built. */
interface JournalEntry {
  id: string;
  /** Short weekday, e.g. "Lun" */
  dow: string;
  /** Day of the month, e.g. "26" */
  date: string;
  day: string;
  /** null while the session has no end time */
  minutes: number | null;
  /** Weight-reps sets, kept raw so the volume follows the exercise's unit once exercises load. */
  loads: readonly JournalLoad[];
  sets: number;
  prs: number;
}

interface JournalRow {
  id: string;
  /** Short weekday, e.g. "Lun" */
  dow: string;
  /** Day of the month, e.g. "26" */
  date: string;
  day: string;
  /** e.g. "52 min · 8420 kg · 18 series", with the volume in the preferred unit */
  stats: string;
  /** e.g. "PR" or "PR ×2"; null without records */
  prLabel: string | null;
}

/** How many sessions the "Diario" section lists. */
const JOURNAL_SIZE = 4;

// ─── File-local helpers ───────────────────────────────────────────────────────

/**
 * Maps a Date to a DayOfWeek string using JS getDay() (0 = Sunday).
 * Duplicated intentionally from get-suggested-day-for-today.use-case.ts
 * per ADR-34 (inline-over-extract for screen-local concerns). Promote
 * to shared util when a third consumer appears.
 */
function dateToDayOfWeek(date: Date): DayOfWeek {
  const DAY_MAP: readonly DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return DAY_MAP[date.getDay()] as DayOfWeek;
}

const DOW_LABELS: Record<DayOfWeek, string> = {
  monday: 'L',
  tuesday: 'M',
  wednesday: 'M',
  thursday: 'J',
  friday: 'V',
  saturday: 'S',
  sunday: 'D',
};

// Index = Date.getDay() (0 = domingo). Fijos para no depender del ICU del entorno.
const WEEKDAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const WEEKDAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

/** "Martes 27 de octubre" */
function formatLongDate(date: Date): string {
  return `${WEEKDAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

/** YYYY-MM-DD in the device's local calendar. */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The date of the `index`-th day (0 = Monday) of the week that contains `today`. */
function dateOfWeekDay(today: Date, index: number): Date {
  const mondayOffset = (today.getDay() + 6) % 7;
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + index);
}

/** "4 × 6–8", "3 × 5", "3 × 60 s", "2 × 5 km". Uses the first set's type. */
function formatTarget(sets: readonly TargetSet[]): string {
  const first = sets[0];
  if (!first) return '—';
  switch (first.type) {
    case 'weight-reps':
    case 'bodyweight-reps': {
      const reps = sets.flatMap((s) => (s.type === first.type ? [s.reps] : []));
      const min = Math.min(...reps);
      const max = Math.max(...reps);
      return `${sets.length} × ${min === max ? min : `${min}–${max}`}`;
    }
    case 'time':
      return `${sets.length} × ${first.durationSec} s`;
    case 'distance-time':
      return `${sets.length} × ${first.distanceKm} km`;
  }
}


// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'fg-training-home-page',
  standalone: true,
  imports: [FgCardComponent, FgButtonComponent, FgIconComponent, FgFirstUseComponent, RouterLink],
  providers: [
    StartSessionUseCase,
    GetActiveSessionUseCase,
    GetSuggestedDayForTodayUseCase,
    CancelSessionUseCase,
    GetLastWorkedSetForExerciseUseCase,
  ],
  template: `
    <section class="training-home bg-page text-ink flex flex-col gap-[18px] px-4 pt-5 pb-4">
      <header class="flex flex-col gap-0.5">
        <span data-today-date class="text-[13px] leading-[18px] font-medium text-ink-2">{{ todayLabel() }}</span>
        <h1 class="text-[32px] leading-9 font-bold tracking-[-0.03em] text-ink">Hoy</h1>
      </header>

      <!-- ENTRENAMIENTO EN CURSO -->
      @if (activeSessionDay()) {
        <fg-card data-in-progress [padding]="16" class="!border-accent">
          <div class="flex flex-col gap-3">
            <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-accent-ink">Entrenamiento en curso</span>
            <h2 class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">{{ activeSessionDay()!.name }}</h2>
            <div class="flex gap-2">
              <button
                fg-button
                variant="primary"
                size="md"
                class="flex-1"
                leadingIcon="play"
                (click)="resumeSession()"
                [disabled]="loading() || cancellingFromHome()"
              >Continuar</button>
              @if (!confirmingCancelFromHome()) {
                <button
                  fg-button
                  variant="destructive"
                  size="md"
                  class="flex-1"
                  leadingIcon="x"
                  (click)="confirmingCancelFromHome.set(true)"
                  [disabled]="loading() || cancellingFromHome()"
                >Cancelar</button>
              } @else {
                <div class="flex flex-col gap-2 flex-1">
                  <span class="text-[13px] leading-[18px] text-ink-2">¿Seguro? No se guarda nada.</span>
                  <div class="flex gap-2">
                    <button fg-button variant="secondary" size="sm" class="flex-1"
                            (click)="confirmingCancelFromHome.set(false)">Volver</button>
                    <button fg-button variant="destructive" size="sm" class="flex-1"
                            (click)="cancelSessionFromHome()" [disabled]="cancellingFromHome()">
                      {{ cancellingFromHome() ? 'Cancelando...' : 'Sí, cancelar' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </fg-card>
      }

      @if (activeRoutine()) {
        <!-- WEEK STRIP -->
        <section data-week-strip aria-label="Semana">
          <fg-card [padding]="0">
            <div class="grid grid-cols-7 gap-1 px-1.5 py-2" role="group" aria-label="Semana">
              @for (cell of weekCells(); track cell.dow) {
                <div
                  [attr.data-week-cell]="cell.dow"
                  [attr.data-week-state]="cell.state"
                  [attr.aria-label]="cell.dow + (cell.dayLabel ? ', día ' + cell.dayLabel : ', descanso')"
                >
                  <div
                    class="flex flex-col items-center gap-1 py-1.5 rounded-lg"
                    [class.bg-accent-soft]="cell.isToday"
                    [attr.aria-current]="cell.isToday ? 'date' : null"
                  >
                    <span
                      class="text-[11px] leading-[14px] font-semibold tracking-[0.04em]"
                      [class.text-accent-ink]="cell.isToday"
                      [class.text-ink-2]="!cell.isToday"
                    >{{ cell.label }}</span>
                    <span
                      data-week-num
                      class="font-mono tabular-nums text-[15px] leading-5 font-medium"
                      [class.text-accent-ink]="cell.isToday"
                      [class.text-ink]="!cell.isToday"
                    >{{ cell.num }}</span>
                    <span
                      class="w-1.5 h-1.5 rounded-full box-border border-[1.5px]"
                      [class.bg-ink]="cell.state === 'done'"
                      [class.border-ink]="cell.state === 'done'"
                      [class.bg-accent]="cell.state === 'today'"
                      [class.border-accent]="cell.state === 'today'"
                      [class.border-ink-2]="cell.state === 'planned'"
                      [class.border-transparent]="cell.state === 'rest'"
                    ></span>
                  </div>
                </div>
              }
            </div>
          </fg-card>
        </section>

        <!-- HOY TOCA -->
        <fg-card data-hero [padding]="0" class="flex flex-col">
          <div class="flex items-baseline justify-between gap-2 px-4 pt-3.5 pb-2.5">
            <div class="flex flex-col gap-0.5 min-w-0">
              @if (suggestedDay(); as s) {
                @switch (s.reason) {
                  @case ('scheduled') {
                    @let todayDay = s.day!;
                    <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-accent-ink">Hoy toca</span>
                    <h2 id="plan-title" class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">{{ todayDay.name }}{{ todayDay.label ? ' · ' + todayDay.label : '' }}</h2>
                  }
                  @case ('rest-day') {
                    <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Hoy</span>
                    <h2 id="plan-title" class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">Día de descanso</h2>
                  }
                  @case ('no-schedule-configured') {
                    <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Sin agenda</span>
                    <h2 id="plan-title" class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">Configurá tu semana</h2>
                  }
                  @case ('no-active-routine') {
                    <!-- unreachable: parent @if (activeRoutine()) guards -->
                  }
                }
              } @else {
                <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Cargando</span>
              }
            </div>
            <span data-routine-card class="text-[13px] leading-[18px] text-ink-2 text-right">{{ activeRoutine()!.name }}</span>
          </div>
          @if (activeRoutine()!.description) {
            <p data-routine-description class="-mt-1 px-4 pb-2.5 text-[13px] leading-[18px] text-ink-2">{{ activeRoutine()!.description }}</p>
          }

          @if (suggestedDay(); as s) {
            @switch (s.reason) {
              @case ('scheduled') {
                @let day = s.day!;
                @if (planRows().length > 0) {
                  <div class="grid grid-cols-[22px_minmax(0,1fr)_72px_96px] gap-x-2 px-4 pb-1.5 border-b border-line text-[11px] leading-[14px] font-semibold tracking-[0.06em] uppercase text-ink-2">
                    <span>#</span><span>Ejercicio</span><span>Objetivo</span><span class="text-right">Última vez</span>
                  </div>
                  <ol class="list-none m-0 p-0">
                    @for (row of planRows(); track row.exerciseId + row.n) {
                      <li data-plan-row class="grid grid-cols-[22px_minmax(0,1fr)_72px_96px] gap-x-2 items-center px-4 min-h-12 border-b border-line-soft">
                        <span class="font-mono text-[13px] text-ink-2">{{ row.n }}</span>
                        <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ row.name }}</span>
                        <span class="font-mono tabular-nums text-[13px] text-ink whitespace-nowrap">{{ row.target }}</span>
                        <span class="font-mono tabular-nums text-[13px] text-ink-2 text-right whitespace-nowrap">{{ row.last }}</span>
                      </li>
                    }
                  </ol>
                }
                <div class="flex items-center justify-between gap-3 px-4 pt-3 pb-4">
                  <span class="font-mono tabular-nums text-[13px] text-ink-2">{{ totalSets() }} {{ totalSets() === 1 ? 'serie' : 'series' }}</span>
                  <button
                    fg-button
                    variant="primary"
                    size="md"
                    leadingIcon="play"
                    (click)="startSession(day)"
                    [disabled]="loading()"
                    [attr.aria-label]="'Empezar sesión de ' + day.name"
                  >Empezá</button>
                </div>
              }
              @case ('rest-day') {
                <p class="px-4 pb-4 text-[15px] leading-5 text-ink-2">Podés elegir cualquier día si querés entrenar.</p>
              }
              @case ('no-schedule-configured') {
                <div class="flex flex-col gap-3 px-4 pb-4">
                  <p class="text-[15px] leading-5 text-ink-2">Asigná días a tu rutina para ver tu día sugerido.</p>
                  <a routerLink="/routines" fg-button variant="accent_soft" size="md">Ir a rutinas</a>
                </div>
              }
            }
          }
        </fg-card>

        <!-- OTROS DÍAS -->
        <section data-days-list class="flex flex-col gap-1.5">
          <h2 class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">{{ daysListTitle() }}</h2>
          <fg-card [padding]="0">
            @for (day of listedDays(); track day.id; let last = $last) {
              <button
                type="button"
                (click)="startSession(day)"
                [disabled]="loading()"
                [attr.aria-label]="'Empezar sesión de ' + day.name"
                class="w-full grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-center text-left px-3.5 py-2 min-h-12 disabled:opacity-50"
                [class.border-b]="!last"
                [class.border-line-soft]="!last"
              >
                <span class="flex flex-col min-w-0">
                  <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ day.name }}</span>
                  <span class="font-mono tabular-nums text-xs leading-4 text-ink-2">
                    @if (day.label) { {{ day.label }} · }{{ day.exercises.length }} {{ day.exercises.length === 1 ? 'ejercicio' : 'ejercicios' }}
                  </span>
                </span>
                <fg-icon name="play" [size]="16" class="text-accent-ink"></fg-icon>
              </button>
            } @empty {
              <p class="px-3.5 py-3 text-[15px] leading-5 text-ink-2">
                {{ trainingDays().length === 0 ? 'Sin días configurados. Agregá días en tu rutina.' : 'No hay otros días en tu rutina.' }}
              </p>
            }
          </fg-card>
        </section>

        <!-- DIARIO -->
        <section data-journal class="flex flex-col gap-1.5">
          <div class="flex items-baseline justify-between">
            <h2 class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Diario</h2>
            <a routerLink="/progress" class="text-[13px] font-medium text-accent-ink py-1.5">Ver todo</a>
          </div>
          <fg-card [padding]="0">
            @for (row of journal(); track row.id; let last = $last) {
              <div
                data-journal-row
                class="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-x-2.5 items-center px-3.5 py-2 min-h-11"
                [class.border-b]="!last"
                [class.border-line-soft]="!last"
              >
                <div class="flex flex-col">
                  <span class="text-[11px] leading-[14px] font-semibold tracking-[0.04em] uppercase text-ink-2">{{ row.dow }}</span>
                  <span class="font-mono text-[15px] leading-5 font-medium text-ink">{{ row.date }}</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ row.day }}</span>
                  <span class="font-mono tabular-nums text-xs leading-4 text-ink-2">{{ row.stats }}</span>
                </div>
                @if (row.prLabel) {
                  <span class="font-mono text-[11px] leading-[14px] font-medium text-accent-ink border border-accent rounded px-[5px] py-0.5">{{ row.prLabel }}</span>
                }
              </div>
            } @empty {
              <p class="px-3.5 py-3 text-[15px] leading-5 text-ink-2">Todavía no terminaste ninguna sesión.</p>
            }
          </fg-card>
        </section>

      } @else if (loaded()) {
        @if (noRoutines()) {
          <!-- PRIMER USO: no routine at all (S8). Applying a template reloads Hoy with it active. -->
          <fg-first-use (applied)="onTemplateApplied()" />
        } @else {
          <!-- EMPTY STATE: routines exist but none is active -->
          <section data-empty-state>
            <fg-card [padding]="20">
              <div class="flex flex-col gap-3">
                <h2 class="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">Sin rutina activa</h2>
                <p class="text-[15px] leading-5 text-ink-2">Creá o activá una rutina para empezar.</p>
                <a routerLink="/routines" fg-button variant="primary" size="lg" class="w-full">Configurar rutinas</a>
              </div>
            </fg-card>
          </section>
        }
      }

      @if (errorMessage()) {
        <p class="text-danger" role="alert">{{ errorMessage() }}</p>
      }
    </section>
  `,
})
export class TrainingHomePage implements OnInit {
  private readonly routineRepo = inject(RoutineRepository);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly startSessionUseCase = inject(StartSessionUseCase);
  private readonly getActiveSessionUseCase = inject(GetActiveSessionUseCase);
  private readonly getSuggestedDayUseCase = inject(GetSuggestedDayForTodayUseCase);
  private readonly cancelSessionUseCase = inject(CancelSessionUseCase);
  private readonly store = inject(TrainingSessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly sessionRepo = inject(SessionRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly getLastSetUseCase = inject(GetLastWorkedSetForExerciseUseCase);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly weightPipe = new DisplayWeightPipe();

  readonly activeRoutine = signal<Routine | null>(null);
  /**
   * True once the first load finished. Until then neither empty state shows, so a user who does have
   * routines never sees "Sin rutina activa" nor Primer uso flash by.
   */
  readonly loaded = signal(false);
  /** True when there is not a single routine, active or not (S8). Only meaningful without an active one. */
  readonly noRoutines = signal(false);
  readonly trainingDays = signal<TrainingDay[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** Discriminated union — null until init resolves. D-33. */
  readonly suggestedDay = signal<SuggestedDayResult | null>(null);

  /**
   * TrainingDay correspondiente a la sesión in-progress, o null si no hay.
   * Cuando no es null, se muestra la card "Entrenamiento en curso".
   */
  readonly activeSessionDay = signal<TrainingDay | null>(null);

  /** Controla la confirmación de cancelar desde la home. */
  readonly confirmingCancelFromHome = signal(false);
  readonly cancellingFromHome = signal(false);

  /** Completed sessions, newest first. Feeds the week strip and "Diario". */
  private readonly completedSessions = signal<Session[]>([]);
  private readonly exerciseById = signal<ReadonlyMap<string, Exercise>>(new Map());
  private readonly lastSetByExerciseId = signal<ReadonlyMap<string, WorkedSet>>(new Map());

  /** "Martes 27 de octubre" */
  readonly todayLabel = computed(() => formatLongDate(new Date()));

  /** Computed week strip — 7 cells always, derived from trainingDays + schedule + sessions + local Date. ADR-34. */
  readonly weekCells = computed<WeekCell[]>(() => {
    const routine = this.activeRoutine();
    const days = this.trainingDays();
    const today = new Date();
    const todayDow = dateToDayOfWeek(today);
    // Local calendar day of startedAt, like "Diario" and the progress heatmap. Session.date is
    // stored in UTC, so a late-night session would land on the next day.
    const doneKeys = new Set(this.completedSessions().map((s) => toLocalDateKey(s.startedAt)));

    return DAYS_OF_WEEK.map((dow, i) => {
      const date = dateOfWeekDay(today, i);
      const dayId = routine?.schedule?.[dow];
      const day = dayId ? days.find(d => d.id === dayId) : undefined;
      const isToday = dow === todayDow;
      const state: WeekCellState = doneKeys.has(toLocalDateKey(date))
        ? 'done'
        : isToday
          ? 'today'
          : day
            ? 'planned'
            : 'rest';
      return {
        dow,
        label: DOW_LABELS[dow],
        num: String(date.getDate()),
        dayLabel: day?.label ?? null,
        isToday,
        state,
      };
    });
  });

  /** Exercises of today's suggested day, with target and last time. */
  readonly planRows = computed<PlanRow[]>(() => {
    const day = this.suggestedDay()?.day;
    if (!day) return [];
    const exercises = this.exerciseById();
    const lasts = this.lastSetByExerciseId();
    const unit = this.userPrefs.unit();
    return [...day.exercises]
      .sort((a, b) => a.order - b.order)
      .map((ex, i) => {
        const last = lasts.get(ex.exerciseId);
        return {
          exerciseId: ex.exerciseId,
          n: String(i + 1).padStart(2, '0'),
          name: exercises.get(ex.exerciseId)?.name ?? '—',
          target: formatTarget(ex.targetSets),
          last: last ? this.formatLast(last, unit, exercises.get(ex.exerciseId)) : '—',
        };
      });
  });

  readonly totalSets = computed(() =>
    (this.suggestedDay()?.day?.exercises ?? []).reduce((acc, ex) => acc + ex.targetSets.length, 0),
  );

  /** Days under "Otros días": every day of the routine except today's suggestion. */
  readonly listedDays = computed(() => {
    const todayId = this.suggestedDay()?.day?.id;
    return this.trainingDays().filter((d) => d.id !== todayId);
  });

  readonly daysListTitle = computed(() => (this.suggestedDay()?.day ? 'Otros días' : 'Días de la rutina'));

  private readonly journalEntries = signal<JournalEntry[]>([]);

  /**
   * "Diario" rows. The volume is shown in the preferred unit, so the rows follow
   * UserPreferencesService.unit even when it loads after the sessions. They also follow the
   * exercises, whose unit (kg or plates) decides how much each set weighs.
   */
  readonly journal = computed<JournalRow[]>(() => {
    const unit = this.userPrefs.unit();
    const exercises = this.exerciseById();
    return this.journalEntries().map((entry) => this.toJournalRow(entry, unit, exercises));
  });

  ngOnInit(): void {
    // Needed by "Diario" on every day, rest days included.
    void this.userPrefs.loadOnce();
    void this.init();
  }

  /** Loads Hoy. Called once on open, and again after a template is applied from Primer uso. */
  private async init(): Promise<void> {
    try {
      await this.loadHome();
    } finally {
      this.loaded.set(true);
    }
  }

  /** Primer uso created a routine (left active, as there was none): show it. */
  async onTemplateApplied(): Promise<void> {
    await this.init();
  }

  /** S8: Primer uso replaces "Sin rutina activa" only when no routine exists at all. */
  private async hasNoRoutines(): Promise<boolean> {
    try {
      return (await this.routineRepo.getAll()).length === 0;
    } catch {
      // Unknown: keep the plain "Sin rutina activa" state.
      return false;
    }
  }

  private async loadHome(): Promise<void> {
    const activeSession = await this.getActiveSessionUseCase.execute();
    if (activeSession) {
      await this.store.loadActive();
      // No redirigir — mostrar card "Entrenamiento en curso" en la home.
      const day = await this.trainingDayRepo.getById(activeSession.dayId);
      this.activeSessionDay.set(day);
      // También cargar rutina y días para mostrar la home completa debajo.
    }

    const routine = await this.routineRepo.getActive();
    this.activeRoutine.set(routine);
    this.noRoutines.set(routine ? false : await this.hasNoRoutines());

    if (routine) {
      const [days, suggested] = await Promise.all([
        this.trainingDayRepo.getByRoutineId(routine.id),
        this.getSuggestedDayUseCase.execute({}),
      ]);
      this.trainingDays.set(days);
      this.suggestedDay.set(suggested);

      // Las secciones de apoyo nunca bloquean ni rompen la home.
      await Promise.all([this.loadExercises(), this.loadPlanContext(suggested), this.loadJournal()]);
    }
  }

  /**
   * Every exercise: names for the plan and the unit (kg or plates) for the plan and for "Diario",
   * which lists sessions of any day, rest days included.
   */
  private async loadExercises(): Promise<void> {
    try {
      const exercises = await this.exerciseRepo.getAll();
      this.exerciseById.set(new Map(exercises.map((e) => [e.id, e])));
    } catch {
      // Sin nombres: la tabla muestra "—"; sin unidad, el volumen cuenta todo como kg.
    }
  }

  /** Last logged set for the exercises of today's day. */
  private async loadPlanContext(suggested: SuggestedDayResult): Promise<void> {
    const day = suggested.day;
    if (!day) return;
    try {
      const lastSets = await Promise.all(day.exercises.map((ex) => this.getLastSetUseCase.execute(ex.exerciseId)));
      const byId = new Map<string, WorkedSet>();
      day.exercises.forEach((ex, i) => {
        const set = lastSets[i];
        if (set) byId.set(ex.exerciseId, set);
      });
      this.lastSetByExerciseId.set(byId);
    } catch {
      // Sin "última vez": la tabla muestra "—".
    }
  }

  /** Latest completed sessions with duration, volume, sets and PR count. */
  private async loadJournal(): Promise<void> {
    try {
      const all = await this.sessionRepo.getAllSessions();
      const completed = all
        .filter((s) => s.status === 'completed')
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      this.completedSessions.set(completed);

      const latest = completed.slice(0, JOURNAL_SIZE);
      const [setsPerSession, dayPerSession] = await Promise.all([
        Promise.all(latest.map((s) => this.sessionRepo.getSetsForSession(s.id))),
        Promise.all(latest.map((s) => this.trainingDayRepo.getById(s.dayId))),
      ]);
      this.journalEntries.set(
        latest.map((session, i) => this.toJournalEntry(session, setsPerSession[i] ?? [], dayPerSession[i] ?? null)),
      );
    } catch {
      this.journalEntries.set([]);
    }
  }

  private toJournalEntry(session: Session, sets: readonly WorkedSet[], day: TrainingDay | null): JournalEntry {
    return {
      id: session.id,
      dow: WEEKDAYS_SHORT_ES[session.startedAt.getDay()] ?? '',
      date: String(session.startedAt.getDate()),
      day: day?.name ?? 'Sesión',
      minutes: session.endedAt
        ? Math.max(1, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60_000))
        : null,
      loads: sets.flatMap((s) =>
        s.type === 'weight-reps' ? [{ exerciseId: s.exerciseId, weight: s.weight.value, reps: s.reps.value }] : [],
      ),
      sets: sets.length,
      prs: sets.filter((s) => s.isPR).length,
    };
  }

  private toJournalRow(entry: JournalEntry, unit: PreferredUnit, exercises: ReadonlyMap<string, Exercise>): JournalRow {
    // In kg: a plates set counts plates × plate weight (S11), through `loadKg`.
    const volumeKg = entry.loads.reduce((acc, l) => acc + loadKg(l.weight, exercises.get(l.exerciseId)) * l.reps, 0);
    const parts = [
      entry.minutes !== null ? `${entry.minutes} min` : null,
      // Rounded to cents so float noise (32.2 × 3 = 96.60000000000001) never reaches the text.
      volumeKg > 0 ? this.weightPipe.transform(Math.round(volumeKg * 100) / 100, unit) : null,
      `${entry.sets} ${entry.sets === 1 ? 'serie' : 'series'}`,
    ].filter((p): p is string => p !== null);

    return {
      id: entry.id,
      dow: entry.dow,
      date: entry.date,
      day: entry.day,
      stats: parts.join(' · '),
      prLabel: entry.prs === 0 ? null : entry.prs === 1 ? 'PR' : `PR ×${entry.prs}`,
    };
  }

  private formatLast(set: WorkedSet, unit: 'kg' | 'lb', exercise: Exercise | undefined): string {
    switch (set.type) {
      case 'weight-reps':
        // Plates stay plates (D4): never converted to lb.
        return exercise?.weightUnit === 'plates'
          ? `${formatPlates(set.weight.value)} × ${set.reps.value}`
          : `${this.weightPipe.transform(set.weight.value, unit)} × ${set.reps.value}`;
      case 'bodyweight-reps':
        return `${set.reps.value} reps`;
      case 'time':
        return `${set.durationSec} s`;
      case 'distance-time':
        return `${set.distanceKm} km`;
    }
  }

  /** Navega a la sesión en curso. */
  resumeSession(): void {
    void this.router.navigate(['/training/session']);
  }

  /** Cancela la sesión in-progress desde la home (sin entrar a ella). */
  async cancelSessionFromHome(): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;

    this.cancellingFromHome.set(true);
    try {
      await this.cancelSessionUseCase.execute({ sessionId: session.id });
      this.store.clear();
      this.activeSessionDay.set(null);
      this.confirmingCancelFromHome.set(false);
    } catch {
      this.cancellingFromHome.set(false);
      this.confirmingCancelFromHome.set(false);
      this.toast.error('No se pudo cancelar el entrenamiento', 'Intentá de nuevo');
    }
  }

  async startSession(day: TrainingDay): Promise<void> {
    const routine = this.activeRoutine();
    if (!routine) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.startSessionUseCase.execute({
        routineId: routine.id,
        dayId: day.id,
      });
      await this.store.loadActive();
      void this.router.navigate(['/training/session']);
    } catch (err) {
      if (err instanceof SessionAlreadyInProgressError) {
        // Retomar sesión existente
        await this.store.loadActive();
        void this.router.navigate(['/training/session']);
      } else {
        this.errorMessage.set('No se pudo iniciar la sesión. Intentá de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
