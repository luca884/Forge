import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Routine } from '../../../routines/domain/routine.entity';
import { TrainingDay } from '../../../routines/domain/training-day.entity';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { StartSessionUseCase } from '../../domain/use-cases/start-session.use-case';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { GetSuggestedDayForTodayUseCase, SuggestedDayResult } from '../../domain/use-cases/get-suggested-day-for-today.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionAlreadyInProgressError } from '../../domain/errors/session-already-in-progress.error';
import { FgCardComponent } from '@core/shared/ui';
import { FgButtonComponent } from '@core/shared/ui';
import { ToastService } from '@core/shared/ui';
import { DAYS_OF_WEEK, DayOfWeek } from '../../../routines/domain/value-objects/weekly-schedule';

// ─── File-local types ─────────────────────────────────────────────────────────

interface WeekCell {
  dow: DayOfWeek;
  /** Short day label: L M M J V S D */
  label: string;
  /** TrainingDay.label for days in schedule, null for rest days */
  dayLabel: string | null;
  isToday: boolean;
}

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

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'fg-training-home-page',
  standalone: true,
  imports: [FgCardComponent, FgButtonComponent, RouterLink],
  providers: [
    StartSessionUseCase,
    GetActiveSessionUseCase,
    GetSuggestedDayForTodayUseCase,
    CancelSessionUseCase,
  ],
  template: `
    <section class="training-home bg-forge-900 min-h-screen flex flex-col gap-4 p-4">
      <header>
        <h1 class="t-h3 text-forge-50">Entrenar</h1>
      </header>

      <!-- ENTRENAMIENTO EN CURSO -->
      @if (activeSessionDay()) {
        <fg-card data-in-progress [padding]="16" class="border border-accent-500/40">
          <div class="flex flex-col gap-3">
            <span class="t-micro text-accent-300 tracking-widest uppercase">ENTRENAMIENTO EN CURSO</span>
            <h2 class="t-h3 text-forge-50">{{ activeSessionDay()!.name }}</h2>
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
                  <span class="t-caption text-forge-300">¿Seguro? No se guarda nada.</span>
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
        <!-- HERO CARD -->
        <fg-card data-hero [padding]="20" class="relative overflow-hidden">
          @if (suggestedDay(); as s) {
            @switch (s.reason) {
              @case ('scheduled') {
                @let day = s.day!;
                <div class="flex flex-col gap-3">
                  <span class="t-micro text-accent-300 tracking-widest uppercase">HOY TOCA</span>
                  <h2 class="t-h1 text-forge-50">{{ day.name }}{{ day.label ? ' · ' + day.label : '' }}</h2>
                  <button
                    fg-button
                    variant="primary"
                    size="lg"
                    [full]="true"
                    leadingIcon="zap"
                    (click)="startSession(day)"
                    [disabled]="loading()"
                    [attr.aria-label]="'Empezar sesión de ' + day.name"
                  >Empezar sesión</button>
                </div>
              }
              @case ('rest-day') {
                <div class="flex flex-col gap-3">
                  <span class="t-micro text-forge-400 tracking-widest uppercase">HOY</span>
                  <h2 class="t-h1 text-forge-50">Día de descanso</h2>
                  <p class="t-body text-forge-300">Podés elegir cualquier día si querés entrenar.</p>
                </div>
              }
              @case ('no-schedule-configured') {
                <div class="flex flex-col gap-3">
                  <span class="t-micro text-forge-400 tracking-widest uppercase">SIN SCHEDULE</span>
                  <h2 class="t-h1 text-forge-50">Configurá tu semana</h2>
                  <p class="t-body text-forge-300">Asigná días a tu rutina para ver tu día sugerido.</p>
                  <a routerLink="/routines" fg-button variant="accent_soft" size="md">Ir a rutinas</a>
                </div>
              }
              @case ('no-active-routine') {
                <!-- unreachable: parent @if (activeRoutine()) guards -->
              }
            }
          } @else {
            <div class="flex flex-col gap-2">
              <span class="t-micro text-forge-500 tracking-widest uppercase">CARGANDO</span>
            </div>
          }
        </fg-card>

        <!-- WEEK STRIP -->
        <section data-week-strip>
          <p class="t-micro text-forge-400 tracking-widest uppercase mb-2">SEMANA</p>
          <fg-card [padding]="14">
            <div class="grid grid-cols-7 gap-1.5" role="group" aria-label="Semana">
              @for (cell of weekCells(); track cell.dow) {
                <div
                  class="text-center flex flex-col items-center gap-1"
                  [attr.data-week-cell]="cell.dow"
                  [attr.aria-label]="cell.dow + (cell.dayLabel ? ', día ' + cell.dayLabel : ', descanso')"
                >
                  <div class="t-caption text-forge-500 text-xs">{{ cell.label }}</div>
                  <div
                    class="week-cell-tile text-xs rounded-sm px-1"
                    [class.is-today]="cell.isToday"
                    [class.has-day]="!!cell.dayLabel"
                    [class.text-accent-300]="cell.isToday"
                    [class.font-semibold]="cell.isToday"
                    [class.text-forge-400]="!cell.isToday"
                    [attr.aria-current]="cell.isToday ? 'date' : null"
                  >
                    {{ cell.dayLabel ?? '—' }}
                  </div>
                </div>
              }
            </div>
          </fg-card>
        </section>

        <!-- RUTINA EN CURSO CARD -->
        <section data-routine-card>
          <p class="t-micro text-forge-400 tracking-widest uppercase mb-2">RUTINA EN CURSO</p>
          <fg-card [padding]="16">
            <h3 class="t-body text-forge-100 font-semibold">{{ activeRoutine()!.name }}</h3>
            @if (activeRoutine()!.description) {
              <p class="t-body-sm text-forge-400 mt-1">{{ activeRoutine()!.description }}</p>
            }
          </fg-card>
        </section>

        <!-- DAYS LIST -->
        <section data-days-list>
          <p class="t-micro text-forge-400 tracking-widest uppercase mb-2">DÍAS DE LA RUTINA</p>
          <div class="flex flex-col gap-2">
            @for (day of trainingDays(); track day.id) {
              <button
                fg-button
                variant="secondary"
                size="md"
                [full]="true"
                (click)="startSession(day)"
                [disabled]="loading()"
              >
                {{ day.name }}{{ day.label ? ' · ' + day.label : '' }}
              </button>
            } @empty {
              <fg-card [padding]="16">
                <p class="t-body text-forge-400">Sin días configurados. Agregá días en tu rutina.</p>
              </fg-card>
            }
          </div>
        </section>

      } @else {
        <!-- EMPTY STATE -->
        <section data-empty-state>
          <fg-card [padding]="20">
            <div class="flex flex-col gap-3">
              <h2 class="t-h3 text-forge-50">Sin rutina activa</h2>
              <p class="t-body text-forge-300">Creá o activá una rutina para empezar.</p>
              <a routerLink="/routines" fg-button variant="primary" size="lg" class="w-full">Configurar rutinas</a>
            </div>
          </fg-card>
        </section>
      }

      @if (errorMessage()) {
        <p class="text-destructive" role="alert">{{ errorMessage() }}</p>
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

  readonly activeRoutine = signal<Routine | null>(null);
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

  /** Computed week strip — 7 cells always, derived from trainingDays + schedule + local Date. ADR-34. */
  readonly weekCells = computed<WeekCell[]>(() => {
    const routine = this.activeRoutine();
    const days = this.trainingDays();
    const todayDow = dateToDayOfWeek(new Date());

    return DAYS_OF_WEEK.map(dow => {
      const dayId = routine?.schedule?.[dow];
      const day = dayId ? days.find(d => d.id === dayId) : undefined;
      return {
        dow,
        label: DOW_LABELS[dow],
        dayLabel: day?.label ?? null,
        isToday: dow === todayDow,
      };
    });
  });

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
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

    if (routine) {
      const [days, suggested] = await Promise.all([
        this.trainingDayRepo.getByRoutineId(routine.id),
        this.getSuggestedDayUseCase.execute({}),
      ]);
      this.trainingDays.set(days);
      this.suggestedDay.set(suggested);
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
