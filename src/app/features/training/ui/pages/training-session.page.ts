import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { Exercise } from '../../../exercises/domain/exercise.entity';
import { ExerciseInDay } from '../../../routines/domain/training-day.entity';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { LogSetUseCase, LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../domain/use-cases/complete-session.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
import { EditWorkedSetUseCase } from '../../domain/use-cases/edit-worked-set.use-case';
import { RemoveWorkedSetUseCase } from '../../domain/use-cases/remove-worked-set.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
import { RestTimerService } from '../services/rest-timer.service';
import { ExerciseSessionCardComponent } from '../components/exercise-session-card.component';
import { RestTimerComponent } from '../components/rest-timer.component';
import { PrCelebrationComponent } from '../components/pr-celebration.component';
import { WorkedSet } from '../../domain/worked-set';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { FgButtonComponent, FgCardComponent, FgSkeletonComponent } from '@core/shared/ui';
import { FgIconComponent } from '@core/shared/ui';
import { ToastService } from '@core/shared/ui';

interface ExerciseWithData {
  exercise: Exercise;
  exerciseInDay: ExerciseInDay;
}

/** Format elapsed seconds as M:SS or H:MM:SS */
function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}

@Component({
  selector: 'fg-training-session-page',
  standalone: true,
  imports: [
    NgClass,
    ExerciseSessionCardComponent,
    RestTimerComponent,
    PrCelebrationComponent,
    FgButtonComponent,
    FgIconComponent,
    FgCardComponent,
    FgSkeletonComponent,
  ],
  providers: [
    LogSetUseCase,
    CompleteSessionUseCase,
    CancelSessionUseCase,
    EditWorkedSetUseCase,
    RemoveWorkedSetUseCase,
  ],
  template: `
    <div class="min-h-screen bg-forge-950 text-forge-100 flex flex-col">
      <!-- Header + rest timer pinned together so the timer follows the scroll -->
      <div class="sticky top-0 z-10" data-testid="session-sticky">
      <header class="px-5 pt-1 pb-3 bg-forge-950">
        <div class="flex items-center justify-between">
          <button fg-button variant="ghost" size="sm" leadingIcon="chevron-left"
                  (click)="goBack()" aria-label="Atrás">
          </button>
          <div class="text-center flex-1">
            <div class="t-caption text-forge-500">SESIÓN · {{ formattedElapsed() }}</div>
            <div class="t-body text-forge-100 font-semibold mt-0.5">
              {{ dayLabel() }} · {{ totalLoggedCount() }} de {{ totalTargetCount() }} sets
            </div>
          </div>
          <div class="w-10"></div>
        </div>
        <!-- Progress bar -->
        <div class="mt-2.5 h-[3px] rounded-full bg-forge-800 overflow-hidden">
          <div class="h-full transition-[width] duration-300"
               style="background: rgb(var(--accent-rgb));"
               [style.width.%]="progressPct()">
          </div>
        </div>
      </header>

      <!-- Rest timer — pinned right under the header -->
      <fg-rest-timer></fg-rest-timer>
      </div>

      <!-- Scroll area -->
      <main class="flex-1 overflow-y-auto px-5 pb-24 pt-3 flex flex-col gap-3">
        <!-- PR celebration -->
        @if (prVisible() && latestPrSet()) {
          <fg-pr-celebration
            [visible]="prVisible()"
            [set]="latestPrSet()"
            [unit]="unit()"
            [exerciseName]="latestPrExerciseName()"
            [delta]="latestPrDelta()"
            (dismissed)="dismissPr()">
          </fg-pr-celebration>
        }

        <!-- Step-by-step: exercise rail + single focused exercise -->
        @if (initLoading()) {
          <fg-card>
            <fg-skeleton [height]="72"></fg-skeleton>
          </fg-card>
          <fg-card>
            <fg-skeleton [height]="72"></fg-skeleton>
          </fg-card>
        }
        @if (!initLoading()) {
          @if (exercisesWithData().length > 0) {
            <!-- Rail: tap any exercise to focus / edit it -->
            <div class="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5" role="tablist" aria-label="Ejercicios">
              @for (item of exercisesWithData(); track item.exercise.id) {
                @let focused = item.exercise.id === focusedId();
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="focused"
                  (click)="focus(item.exercise.id)"
                  class="flex-shrink-0 max-w-[160px] px-3 py-2 rounded-xl text-left ring-1 ring-inset transition-colors"
                  [ngClass]="focused ? 'bg-forge-800 ring-white/20' : 'bg-forge-900 ring-white/5'"
                >
                  <div class="flex items-center gap-1.5">
                    @if (isComplete(item)) {
                      <fg-icon name="check-circle" [size]="13" class="text-accent-300 flex-shrink-0"></fg-icon>
                    } @else {
                      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            [class.bg-accent-400]="focused"
                            [class.bg-forge-600]="!focused"></span>
                    }
                    <span class="t-body-sm truncate"
                          [class.text-forge-100]="focused"
                          [class.text-forge-400]="!focused">
                      {{ item.exercise.name }}
                    </span>
                  </div>
                  <div class="t-caption text-forge-500 tabular-nums mt-0.5">
                    {{ loggedCountFor(item) }}/{{ item.exerciseInDay.targetSets.length }}
                  </div>
                </button>
              }
            </div>

            <!-- Focused exercise only -->
            @if (focusedItem(); as item) {
              <fg-exercise-session-card
                [exercise]="item.exercise"
                [targetSets]="item.exerciseInDay.targetSets"
                [loggedSets]="store.setsByExercise().get(item.exercise.id) ?? []"
                [sessionId]="store.activeSession()?.id ?? ''"
                [unit]="unit()"
                [expanded]="true"
                (setLogged)="onSetLogged($event)"
                (setEdited)="onWorkedSetEdited($event)"
                (setRemoved)="onWorkedSetRemoved($event)">
              </fg-exercise-session-card>
            }
          } @else {
            <p class="t-body text-forge-500 text-center py-12">
              No hay ejercicios en este día de entrenamiento.
            </p>
          }
        }

        <!-- CTA: terminar y cancelar -->
        <div class="mt-4 flex flex-col gap-2">
          <button fg-button variant="ghost" size="md" [full]="true" leadingIcon="check"
                  (click)="completeSession()" [disabled]="completing() || cancelling()">
            {{ completing() ? 'Completando...' : 'Terminar sesión' }}
          </button>

          <div class="pt-2 border-t border-forge-800">
            @if (!confirmingCancel()) {
              <button fg-button variant="destructive" size="md" [full]="true" leadingIcon="x"
                      (click)="confirmingCancel.set(true)"
                      [disabled]="completing() || cancelling()">
                Cancelar entrenamiento
              </button>
            } @else {
              <div class="flex flex-col gap-2">
                <span class="t-body-sm text-forge-300">¿Seguro? No se guarda nada y se borran los PRs de esta sesión.</span>
                <div class="flex gap-2">
                  <button fg-button variant="secondary" size="sm" class="flex-1"
                          (click)="confirmingCancel.set(false)">
                    Seguir entrenando
                  </button>
                  <button fg-button variant="destructive" size="sm" class="flex-1"
                          (click)="cancelSession()" [disabled]="cancelling()">
                    {{ cancelling() ? 'Cancelando...' : 'Sí, cancelar' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class TrainingSessionPage implements OnInit {
  readonly store = inject(TrainingSessionStore);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly logSetUseCase = inject(LogSetUseCase);
  private readonly completeSessionUseCase = inject(CompleteSessionUseCase);
  private readonly cancelSessionUseCase = inject(CancelSessionUseCase);
  private readonly editWorkedSetUseCase = inject(EditWorkedSetUseCase);
  private readonly removeWorkedSetUseCase = inject(RemoveWorkedSetUseCase);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly prRepo = inject(PersonalRecordRepository);
  private readonly toast = inject(ToastService);
  private readonly restTimer = inject(RestTimerService);

  /** Preferred weight unit — propagated to ExerciseSessionCard and PrCelebration (D-5, ADR-22). */
  readonly unit = this.userPrefs.unit;

  readonly exercisesWithData = signal<ExerciseWithData[]>([]);
  readonly initLoading = signal(true);
  readonly completing = signal(false);
  readonly cancelling = signal(false);
  readonly confirmingCancel = signal(false);
  readonly prVisible = signal(false);
  readonly latestPrSet = signal<WorkedSet | null>(null);
  readonly latestPrExerciseName = signal('');
  readonly latestPrDelta = signal<string | null>(null);
  readonly dayLabel = signal('Sesión');

  /** Exercise the user is currently focused on (step-by-step). Null → falls back to first incomplete. */
  readonly focusedExerciseId = signal<string | null>(null);

  /** The single exercise shown in the focused view. Defaults to the first item when nothing is focused. */
  readonly focusedItem = computed<ExerciseWithData | null>(() => {
    const items = this.exercisesWithData();
    if (items.length === 0) return null;
    const id = this.focusedExerciseId();
    return items.find((i) => i.exercise.id === id) ?? items[0] ?? null;
  });

  /** Id of the focused exercise (or null) — used by the rail to highlight the active chip. */
  readonly focusedId = computed<string | null>(() => this.focusedItem()?.exercise.id ?? null);

  /** Total logged sets across all exercises in this session. */
  readonly totalLoggedCount = computed(() => this.store.workedSets().length);

  /** Total target sets across all exercises in the routine day. */
  readonly totalTargetCount = computed(() =>
    this.exercisesWithData().reduce((sum, item) => sum + item.exerciseInDay.targetSets.length, 0)
  );

  /** Progress as percentage 0–100. */
  readonly progressPct = computed(() => {
    const total = this.totalTargetCount();
    if (total === 0) return 0;
    return Math.min(100, (this.totalLoggedCount() / total) * 100);
  });

  /** Elapsed time formatted as M:SS or H:MM:SS. */
  readonly formattedElapsed = computed(() => formatHMS(this.store.elapsedSeconds()));

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      if (!this.store.activeSession()) {
        await this.store.loadActive();
      }

      const session = this.store.activeSession();
      if (!session) {
        void this.router.navigate(['/training']);
        return;
      }

      await this.store.refreshSets();

      const day = await this.trainingDayRepo.getById(session.dayId);
      if (!day) return;

      if (day.name) {
        this.dayLabel.set(day.name);
      }

      const allExercises = await this.exerciseRepo.getAll();
      const exerciseById = new Map(allExercises.map(e => [e.id, e]));

      const exercisesWithData: ExerciseWithData[] = [];
      for (const exInDay of day.exercises) {
        const exercise = exerciseById.get(exInDay.exerciseId);
        if (exercise) {
          exercisesWithData.push({ exercise, exerciseInDay: exInDay });
        }
      }
      this.exercisesWithData.set(exercisesWithData);

      // Step-by-step: start focused on the first exercise that still has sets pending.
      this.focusedExerciseId.set(this.firstIncompleteId(exercisesWithData));

      // Build rest plan from exercises that have a per-exercise override.
      const restPlan = new Map<string, number>();
      for (const exInDay of day.exercises) {
        if (exInDay.restSeconds !== undefined) {
          restPlan.set(exInDay.exerciseId, exInDay.restSeconds);
        }
      }
      this.restTimer.setRestPlan(restPlan);
    } finally {
      this.initLoading.set(false);
    }
  }

  async onSetLogged(input: LogSetInput): Promise<void> {
    try {
      // D-5: capture previous PR BEFORE executing (ADR-38)
      const previousPR = await this.prRepo.getCurrentForExercise(
        input.exerciseId,
        input.type,
      );

      const set = await this.logSetUseCase.execute(input);

      if (set.isPR) {
        this.latestPrSet.set(set);

        const exerciseName = this.exercisesWithData()
          .find(e => e.exercise.id === input.exerciseId)?.exercise.name ?? '';
        this.latestPrExerciseName.set(exerciseName);
        this.latestPrDelta.set(this.formatDelta(set, previousPR));
        this.prVisible.set(true);
      }
    } catch (err) {
      // Defensive — should not happen if form validator min(0.1) is in place (carry-over E1)
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.error('[TrainingSessionPage] onSetLogged error (should be unreachable):', err);
      }
      this.toast.error('No se pudo guardar la serie', 'Intentá de nuevo');
    }
  }

  /** Edits a past set. The store refreshes via the WorkedSetEdited event. */
  async onWorkedSetEdited(updatedSet: WorkedSet): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;
    try {
      await this.editWorkedSetUseCase.execute({ sessionId: session.id, updatedSet });
    } catch {
      this.toast.error('No se pudo editar la serie', 'Intentá de nuevo');
    }
  }

  /** Removes a past set. The store refreshes via the WorkedSetRemoved event. */
  async onWorkedSetRemoved(setId: string): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;
    try {
      await this.removeWorkedSetUseCase.execute({ sessionId: session.id, setId });
    } catch {
      this.toast.error('No se pudo borrar la serie', 'Intentá de nuevo');
    }
  }

  async completeSession(): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;

    this.completing.set(true);
    try {
      await this.completeSessionUseCase.execute({ sessionId: session.id });
      void this.router.navigate(['/training/session/summary']);
    } catch {
      this.completing.set(false);
      this.toast.error('No se pudo completar la sesión', 'Intentá de nuevo');
    }
  }

  async cancelSession(): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;

    this.cancelling.set(true);
    try {
      await this.cancelSessionUseCase.execute({ sessionId: session.id });
      this.restTimer.cancel();
      this.store.clear();
      void this.router.navigate(['/training']);
    } catch {
      this.cancelling.set(false);
      this.confirmingCancel.set(false);
      this.toast.error('No se pudo cancelar el entrenamiento', 'Intentá de nuevo');
    }
  }

  dismissPr(): void {
    this.prVisible.set(false);
    this.latestPrSet.set(null);
    this.latestPrExerciseName.set('');
    this.latestPrDelta.set(null);
  }

  goBack(): void {
    void this.router.navigate(['/training']);
  }

  /** Focuses an exercise (rail tap) — shows it as the single active card. */
  focus(exerciseId: string): void {
    this.focusedExerciseId.set(exerciseId);
  }

  /** Logged sets count for an exercise in the current session. */
  loggedCountFor(item: ExerciseWithData): number {
    return this.store.setsByExercise().get(item.exercise.id)?.length ?? 0;
  }

  /** True when the exercise has logged all its target sets. */
  isComplete(item: ExerciseWithData): boolean {
    const target = item.exerciseInDay.targetSets.length;
    return target > 0 && this.loggedCountFor(item) >= target;
  }

  /** Id of the first exercise with sets still pending, or the first exercise as fallback. */
  private firstIncompleteId(items: ExerciseWithData[]): string | null {
    const incomplete = items.find((i) => !this.isComplete(i));
    return (incomplete ?? items[0])?.exercise.id ?? null;
  }

  /** Format the PR delta as a human-readable string. Returns null for first-ever PR. */
  private formatDelta(newSet: WorkedSet, prev: PersonalRecord | null): string | null {
    if (!prev) return null;
    switch (newSet.type) {
      case 'weight-reps': {
        const prevW = prev.set.type === 'weight-reps' ? prev.set.weight.value : 0;
        const diff = newSet.weight.value - prevW;
        return diff > 0 ? `+${diff} kg` : null;
      }
      case 'bodyweight-reps': {
        const prevReps = prev.set.type === 'bodyweight-reps' ? prev.set.reps.value : 0;
        const diff = newSet.reps.value - prevReps;
        return diff > 0 ? `+${diff} reps` : null;
      }
      default:
        return null;
    }
  }
}
