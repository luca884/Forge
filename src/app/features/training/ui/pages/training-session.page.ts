import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Exercise } from '../../../exercises/domain/exercise.entity';
import { ExerciseInDay } from '../../../routines/domain/training-day.entity';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { LogSetUseCase, LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../domain/use-cases/complete-session.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
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
  ],
  template: `
    <div class="min-h-screen bg-forge-950 text-forge-100 flex flex-col">
      <!-- Sticky header -->
      <header class="sticky top-0 z-10 px-5 pt-1 pb-3 bg-forge-950">
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

      <!-- Rest timer -->
      <fg-rest-timer></fg-rest-timer>

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

        <!-- Exercise list with auto-collapse -->
        @if (initLoading()) {
          <fg-card>
            <fg-skeleton [height]="72"></fg-skeleton>
          </fg-card>
          <fg-card>
            <fg-skeleton [height]="72"></fg-skeleton>
          </fg-card>
        }
        @if (!initLoading()) {
        @for (item of exercisesWithData(); track item.exercise.id) {
          @let isCollapsed = collapsedIds().has(item.exercise.id);
          @if (isCollapsed) {
            <!-- Compact collapsed card -->
            <button type="button" (click)="toggleExpanded(item.exercise.id)"
                    class="w-full px-4 py-3.5 flex justify-between items-center bg-forge-900 rounded-xl">
              <div class="text-left">
                <div class="t-body text-forge-200">{{ item.exercise.name }}</div>
                <div class="t-caption text-forge-600 mt-0.5 tabular-nums">
                  {{ targetLabel(item) }}
                </div>
              </div>
              <fg-icon name="chevron-down" [size]="16" class="text-forge-700"></fg-icon>
            </button>
          } @else {
            <fg-exercise-session-card
              [exercise]="item.exercise"
              [targetSets]="item.exerciseInDay.targetSets"
              [loggedSets]="store.setsByExercise().get(item.exercise.id) ?? []"
              [sessionId]="store.activeSession()?.id ?? ''"
              [unit]="unit()"
              [expanded]="true"
              (setLogged)="onSetLogged($event)">
            </fg-exercise-session-card>
          }
        } @empty {
          <p class="t-body text-forge-500 text-center py-12">
            No hay ejercicios en este día de entrenamiento.
          </p>
        }

        } <!-- end @if (!initLoading()) -->

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

  /** XOR override layer: set of exerciseIds manually toggled by the user. */
  readonly userOverrides = signal<ReadonlySet<string>>(new Set());

  /** Computed set of collapsed exercise IDs (auto-collapse XOR userOverrides). */
  readonly collapsedIds = computed(() => {
    const result = new Set<string>();
    for (const item of this.exercisesWithData()) {
      const logged = this.store.setsByExercise().get(item.exercise.id)?.length ?? 0;
      const target = item.exerciseInDay.targetSets.length;
      const autoCollapsed = logged >= target && target > 0;
      const overridden = this.userOverrides().has(item.exercise.id);
      // XOR: if auto-collapsed but overridden → expanded. If not auto but overridden → collapsed.
      if (autoCollapsed !== overridden) result.add(item.exercise.id);
    }
    return result;
  });

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

  toggleExpanded(exerciseId: string): void {
    this.userOverrides.update(s => {
      const next = new Set(s);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }

  targetLabel(item: ExerciseWithData): string {
    const logged = this.store.setsByExercise().get(item.exercise.id)?.length ?? 0;
    const target = item.exerciseInDay.targetSets.length;
    return `${logged} / ${target} sets`;
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
