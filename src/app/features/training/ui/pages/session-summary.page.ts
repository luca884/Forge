import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { WorkedSet } from '../../domain/worked-set';
import { Session } from '../../domain/session.entity';
import { GetPreviousSessionSetsUseCase } from '../../domain/use-cases/get-previous-session-sets.use-case';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { loadKg, type WeightUnitInfo } from '@core/shared/domain/weight-unit';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { FgButtonComponent, FgCardComponent, FgIconComponent, FgSkeletonComponent, ToastService } from '@core/shared/ui';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { formatPlates } from '../format-plates';

/** Format elapsed seconds as MM:SS or H:MM:SS */
function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${String(m).padStart(2, '0')}:${ss}`;
}

// Index = Date.getDay() / Date.getMonth(). Fijos para no depender del ICU del entorno.
const WEEKDAYS_SHORT_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const MONTHS_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** 18:05 */
function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface ExerciseRow {
  exerciseId: string;
  name: string;
  sets: number;
  /** Total reps of the exercise in the session; null when its sets have no reps (time, distance). */
  reps: number | null;
  /** Best set of the session, e.g. "102.5 kg×7" or "7 placas×5". */
  best: string;
  /** Change of the best weight versus the previous session: "+2.5 kg", "+1 placa", "igual", "—". */
  delta: string;
  deltaPositive: boolean;
}

interface PrRow {
  exerciseId: string;
  exerciseName: string;
  set: WorkedSet;
  delta: string | null;
  detail: string;
}

@Component({
  selector: 'fg-session-summary-page',
  standalone: true,
  imports: [DisplayWeightPipe, FgButtonComponent, FgCardComponent, FgIconComponent, FgSkeletonComponent],
  providers: [GetPreviousSessionSetsUseCase],
  template: `
    <div class="min-h-full bg-page text-ink flex flex-col gap-3.5 px-4 pt-2 pb-6">
      <div class="flex items-center -mx-2">
        <button type="button" aria-label="Cerrar resumen" (click)="goHome()"
                class="w-11 h-11 flex items-center justify-center text-ink">
          <fg-icon name="x" [size]="22"></fg-icon>
        </button>
      </div>

      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
      } @else {
        <header class="flex flex-col gap-0.5">
          <span class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-accent-ink">Sesión terminada</span>
          <h1 class="text-[32px] leading-[38px] font-bold tracking-[-0.03em] text-ink">{{ dayName() }}</h1>
          @if (when()) {
            <span data-session-when class="font-mono text-[13px] leading-[18px] text-ink-2">{{ when() }}</span>
          }
        </header>

        <!-- Totales -->
        <!-- 1fr (min auto), not grid-cols-4 (min 0): a long volume widens its column instead of overflowing it. -->
        <section aria-label="Totales" class="grid grid-cols-[repeat(4,1fr)] bg-surface border border-line rounded-lg">
          <div class="flex flex-col gap-1 px-2.5 py-3 border-r border-line-soft">
            <span data-total-label class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Duración</span>
            <span data-total-value class="font-mono tabular-nums text-[17px] font-medium text-ink">{{ duration() ?? '—' }}</span>
          </div>
          <div class="flex flex-col gap-1 px-2.5 py-3 border-r border-line-soft">
            <span data-total-label class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Volumen</span>
            <span class="flex items-baseline gap-1">
              <span data-total-value class="font-mono tabular-nums text-[17px] font-medium text-ink">{{ hasVolume() ? volumeDisplay().value : '—' }}</span>
              @if (hasVolume()) {
                <span data-total-unit class="font-mono text-[11px] text-ink-2">{{ volumeDisplay().unit }}</span>
              }
            </span>
          </div>
          <div class="flex flex-col gap-1 px-2.5 py-3 border-r border-line-soft">
            <span data-total-label class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Series</span>
            <span data-total-value class="font-mono tabular-nums text-[17px] font-medium text-ink">{{ totalSets() }}</span>
          </div>
          <div class="flex flex-col gap-1 px-2.5 py-3">
            <span data-total-label class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Reps</span>
            <span data-total-value class="font-mono tabular-nums text-[17px] font-medium text-ink">{{ totalReps() }}</span>
          </div>
        </section>
        @if (!hasVolume()) {
          <p class="-mt-1.5 px-1 text-[12px] leading-4 text-ink-2">Sin volumen registrado</p>
        }

        <!-- Récords -->
        @for (row of prRows(); track row.set.id) {
          <section data-pr-card [attr.aria-label]="'Récord nuevo · ' + (row.exerciseName || row.exerciseId)"
                   class="flex gap-3 items-start p-3.5 rounded-lg border border-accent bg-accent-soft">
            <span class="w-9 h-9 flex-none rounded-lg bg-accent text-accent-on flex items-center justify-center">
              <fg-icon name="trophy" [size]="20"></fg-icon>
            </span>
            <div class="flex flex-col gap-0.5 min-w-0">
              <h2 class="text-[13px] leading-[18px] font-semibold text-accent-ink">Récord nuevo · {{ row.exerciseName || row.exerciseId }}</h2>
              <span class="font-mono tabular-nums text-[22px] leading-7 font-medium text-ink">{{ row.detail }}</span>
              @if (row.delta) {
                <span class="font-mono text-xs leading-4 text-ink-2">{{ row.delta }} vs. récord anterior</span>
              }
            </div>
          </section>
        }

        <!-- Ejercicio por ejercicio -->
        <section aria-labelledby="ex-title" class="bg-surface border border-line rounded-lg">
          <h2 id="ex-title" class="px-3.5 pt-3 pb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Ejercicio por ejercicio</h2>
          @if (exerciseRows().length > 0) {
            <div class="grid grid-cols-[minmax(0,1fr)_36px_92px_64px] gap-x-2 px-3.5 pb-1.5 border-b border-line text-[10px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2">
              <span>Ejercicio</span><span>Series</span><span>Mejor</span><span class="text-right">vs. ant.</span>
            </div>
          }
          @for (row of exerciseRows(); track row.exerciseId; let last = $last) {
            <div data-exercise-row
                 class="grid grid-cols-[minmax(0,1fr)_36px_92px_64px] gap-x-2 items-center min-h-11 px-3.5"
                 [class.border-b]="!last"
                 [class.border-line-soft]="!last">
              <div class="flex flex-col min-w-0 py-1.5">
                <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ row.name || row.exerciseId }}</span>
                @if (row.reps !== null) {
                  <span data-row-reps class="font-mono tabular-nums text-xs leading-4 text-ink-2">{{ row.reps }} reps</span>
                }
              </div>
              <span data-row-sets class="font-mono text-[13px] text-ink-2">{{ row.sets }}</span>
              <span data-row-best class="font-mono tabular-nums text-[13px] text-ink whitespace-nowrap">{{ row.best }}</span>
              <span data-row-delta class="font-mono text-xs text-right whitespace-nowrap"
                    [class.text-accent-ink]="row.deltaPositive"
                    [class.font-medium]="row.deltaPositive"
                    [class.text-ink-2]="!row.deltaPositive">{{ row.delta }}</span>
            </div>
          } @empty {
            <p class="px-3.5 pb-3 text-[15px] leading-5 text-ink-2">No se registraron series.</p>
          }
        </section>

        <!-- Individual set detail (per-set weight/reps for unit display) -->
        @for (set of workedSets(); track set.id) {
          <div class="hidden">
            @switch (set.type) {
              @case ('weight-reps') {
                <span class="session-summary__set-detail">{{ set.reps.value }} reps ×
                  @if (isPlates(set.exerciseId)) {
                    {{ plates(set.weight.value) }}
                  } @else {
                    {{ set.weight.value | displayWeight: unit() }}
                  }
                </span>
              }
              @case ('bodyweight-reps') {
                <span class="session-summary__set-detail">{{ set.reps.value }} reps
                  @if (set.extraWeight) {
                    (+ {{ set.extraWeight.value | displayWeight: unit() }})
                  }
                </span>
              }
              @case ('time') {
                <span class="session-summary__set-detail">{{ set.durationSec }}s</span>
              }
              @case ('distance-time') {
                <span class="session-summary__set-detail">{{ set.distanceKm }} km en {{ set.durationSec }}s</span>
              }
            }
          </div>
        }
      }

      <!-- CTA — always visible -->
      <button fg-button variant="primary" size="lg" [full]="true" class="mt-auto" (click)="goHome()">
        Guardar sesión
      </button>
    </div>
  `,
})
export class SessionSummaryPage implements OnInit {
  private readonly store = inject(TrainingSessionStore);
  private readonly sessionRepo = inject(SessionRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly prRepo = inject(PersonalRecordRepository);
  private readonly toast = inject(ToastService);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly getPreviousSets = inject(GetPreviousSessionSetsUseCase);
  private readonly weightPipe = new DisplayWeightPipe();

  readonly unit = this.userPrefs.unit;
  readonly loading = signal(true);
  readonly session = signal<Session | null>(null);
  readonly workedSets = signal<readonly WorkedSet[]>([]);

  /** Map of exerciseId → name, populated in init() from worked sets context. */
  readonly exerciseNameById = signal<Map<string, string>>(new Map());

  /** Name of the TrainingDay the session was done for. */
  readonly dayName = signal('Sesión');

  /**
   * Map of exerciseId → what tells a logged weight apart (`weightUnit`, `plateWeightKg`).
   * An unknown exercise counts as kg.
   */
  private readonly weightInfoByExerciseId = signal<ReadonlyMap<string, WeightUnitInfo>>(new Map());

  /**
   * Map of exerciseId → best weight of the previous session, when there was one, in the unit the
   * exercise is logged in (kg, or plates for a plates exercise).
   */
  readonly previousBestByExerciseId = signal<ReadonlyMap<string, number>>(new Map());

  /** Map of exerciseId → previous PersonalRecord (before this session). */
  readonly previousPRsByExerciseId = signal<Map<string, PersonalRecord>>(new Map());

  // ---------------------------------------------------------------------------
  // Volume computeds
  // ---------------------------------------------------------------------------

  /** Volume in kg: a plates set counts plates × plate weight (S11), through `loadKg`. */
  readonly volumeKg = computed(() => {
    const info = this.weightInfoByExerciseId();
    return this.workedSets().reduce((acc, s) => {
      if (s.type === 'weight-reps') return acc + loadKg(s.weight.value, info.get(s.exerciseId)) * s.reps.value;
      return acc;
    }, 0);
  });

  readonly hasVolume = computed(() => this.volumeKg() > 0);

  /**
   * The volume in the preferred unit, through DisplayWeightPipe like every weight on the page,
   * split into number and unit so the totals tile can set the unit small ("2000" + "kg").
   */
  readonly volumeDisplay = computed(() => {
    const text = this.formatWeight(this.volumeKg());
    const cut = text.lastIndexOf(' ');
    return { value: text.slice(0, cut), unit: text.slice(cut + 1) };
  });

  // ---------------------------------------------------------------------------
  // Stats computeds
  // ---------------------------------------------------------------------------

  readonly totalSets = computed(() => this.workedSets().length);

  readonly totalPrs = computed(() => this.workedSets().filter(s => s.isPR).length);

  readonly prSets = computed(() => this.workedSets().filter(s => s.isPR));

  readonly totalReps = computed(() =>
    this.workedSets().reduce((acc, s) => {
      if (s.type === 'weight-reps' || s.type === 'bodyweight-reps') return acc + s.reps.value;
      return acc;
    }, 0)
  );

  readonly duration = computed(() => {
    const s = this.session();
    if (!s?.endedAt) return null;
    const totalSec = Math.floor((s.endedAt.getTime() - s.startedAt.getTime()) / 1000);
    return formatHMS(totalSec);
  });

  /** "mar 27 oct · 18:05–19:03" */
  readonly when = computed(() => {
    const session = this.session();
    if (!session) return '';
    const start = session.startedAt;
    const day = `${WEEKDAYS_SHORT_ES[start.getDay()]} ${start.getDate()} ${MONTHS_SHORT_ES[start.getMonth()]}`;
    const hours = session.endedAt
      ? `${formatClock(start)}–${formatClock(session.endedAt)}`
      : formatClock(start);
    return `${day} · ${hours}`;
  });

  // ---------------------------------------------------------------------------
  // Per-exercise breakdown
  // ---------------------------------------------------------------------------

  readonly exerciseRows = computed<ExerciseRow[]>(() => {
    const byId = new Map<string, WorkedSet[]>();
    for (const s of this.workedSets()) {
      byId.set(s.exerciseId, [...(byId.get(s.exerciseId) ?? []), s]);
    }
    const previous = this.previousBestByExerciseId();
    return Array.from(byId, ([exerciseId, sets]) => {
      const best = this.bestWeight(sets);
      const previousBest = previous.get(exerciseId);
      const diff = best !== null && previousBest !== undefined ? best - previousBest : null;
      const reps = sets.flatMap(s => (s.type === 'weight-reps' || s.type === 'bodyweight-reps' ? [s.reps.value] : []));
      return {
        exerciseId,
        name: this.exerciseNameById().get(exerciseId) ?? '',
        sets: sets.length,
        reps: reps.length === 0 ? null : reps.reduce((acc, value) => acc + value, 0),
        best: this.formatBest(sets),
        delta: diff === null ? '—' : diff === 0 ? 'igual' : `${diff > 0 ? '+' : '-'}${this.formatWeightOf(exerciseId, Math.abs(diff))}`,
        deltaPositive: diff !== null && diff > 0,
      };
    });
  });

  // ---------------------------------------------------------------------------
  // PR rows
  // ---------------------------------------------------------------------------

  readonly prRows = computed<PrRow[]>(() => {
    return this.workedSets()
      .filter(s => s.isPR)
      .map(s => {
        const prevPR = this.previousPRsByExerciseId().get(s.exerciseId) ?? null;
        return {
          exerciseId: s.exerciseId,
          exerciseName: this.exerciseNameById().get(s.exerciseId) ?? '',
          set: s,
          delta: this.computeDelta(s, prevPR),
          detail: this.formatSetDetail(s),
        };
      });
  });

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.init();
  }

  private async init(): Promise<void> {
    const activeSession = this.store.activeSession();
    if (activeSession) {
      try {
        // Resolve exercise names in parallel with session/set loading (ADR-40 inline pattern)
        const [completedSession, allExercises] = await Promise.all([
          this.sessionRepo.getById(activeSession.id),
          this.exerciseRepo.getAll(),
        ]);

        this.exerciseNameById.set(new Map(allExercises.map(e => [e.id, e.name])));
        this.weightInfoByExerciseId.set(new Map(allExercises.map(e => [e.id, e])));
        this.session.set(completedSession);

        // Load its sets
        if (completedSession) {
          const sets = await this.sessionRepo.getSetsForSession(completedSession.id);
          this.workedSets.set(sets);

          // Day title and the previous session's best weights are context: never fail the summary over them.
          await Promise.all([
            this.loadDayName(completedSession),
            this.loadPreviousBests(completedSession, sets),
          ]);

          // Load previous PRs for exercises that have new PRs (N calls, parallelized)
          const prExerciseIds = [...new Set(sets.filter(s => s.isPR).map(s => s.exerciseId))];
          const prResults = await Promise.all(
            prExerciseIds.map(async exId => {
              const allPRs = await this.prRepo.listAll(exId);
              // Second-most-recent = the previous PR before today's session
              const previousPR = allPRs.length >= 2 ? allPRs[1] : null;
              return { exId, previousPR };
            })
          );

          const prevMap = new Map<string, PersonalRecord>();
          for (const { exId, previousPR } of prResults) {
            if (previousPR) prevMap.set(exId, previousPR);
          }
          this.previousPRsByExerciseId.set(prevMap);
        }
      } catch {
        this.toast.error('No se pudo cargar el resumen', 'Intentá de nuevo');
      } finally {
        this.loading.set(false);
      }
    } else {
      // No session in store — navigate home
      this.loading.set(false);
      void this.router.navigate(['/training']);
    }
  }

  private async loadDayName(session: Session): Promise<void> {
    try {
      const day = await this.trainingDayRepo.getById(session.dayId);
      if (day) this.dayName.set(day.name);
    } catch {
      // Keeps the neutral "Sesión" title.
    }
  }

  private async loadPreviousBests(session: Session, sets: readonly WorkedSet[]): Promise<void> {
    const exerciseIds = [...new Set(sets.filter(s => s.type === 'weight-reps').map(s => s.exerciseId))];
    const entries = await Promise.all(
      exerciseIds.map(async (id): Promise<[string, number] | null> => {
        try {
          const previous = await this.getPreviousSets.execute(id, session.id);
          const best = this.bestWeight(previous);
          return best === null ? null : [id, best];
        } catch {
          return null;
        }
      }),
    );
    this.previousBestByExerciseId.set(
      new Map(entries.filter((e): e is [string, number] => e !== null)),
    );
  }

  goHome(): void {
    void this.router.navigate(['/training']);
  }

  /** Any weight shown on the page: same conversion and format as `displayWeight`, in the preferred unit. */
  private formatWeight(kg: number): string {
    // Rounded to cents so float noise (100.3 - 100) never reaches the text.
    return this.weightPipe.transform(Math.round(kg * 100) / 100, this.unit());
  }

  /** True when the exercise logs its weight in machine plates (D4). */
  protected isPlates(exerciseId: string): boolean {
    return this.weightInfoByExerciseId().get(exerciseId)?.weightUnit === 'plates';
  }

  protected plates(count: number): string {
    return formatPlates(count);
  }

  /**
   * A logged weight of the exercise as text: plates stay plates, never converted (D4); anything
   * else goes through the preferred unit.
   */
  private formatWeightOf(exerciseId: string, value: number): string {
    return this.isPlates(exerciseId) ? formatPlates(value) : this.formatWeight(value);
  }

  /** Heaviest weight-reps set, in the exercise's own unit, or null when there is none. */
  private bestWeight(sets: readonly WorkedSet[]): number | null {
    const weights = sets.flatMap(s => (s.type === 'weight-reps' ? [s.weight.value] : []));
    return weights.length === 0 ? null : Math.max(...weights);
  }

  /** Best set of an exercise: heaviest (then most reps) for weight, else the top value of its metric. */
  private formatBest(sets: readonly WorkedSet[]): string {
    const first = sets[0];
    if (!first) return '—';
    switch (first.type) {
      case 'weight-reps': {
        const best = sets
          .filter((s): s is Extract<WorkedSet, { type: 'weight-reps' }> => s.type === 'weight-reps')
          .reduce((a, b) =>
            b.weight.value > a.weight.value || (b.weight.value === a.weight.value && b.reps.value > a.reps.value) ? b : a,
          );
        return `${this.formatWeightOf(best.exerciseId, best.weight.value)}×${best.reps.value}`;
      }
      case 'bodyweight-reps':
        return `${Math.max(...sets.flatMap(s => (s.type === 'bodyweight-reps' ? [s.reps.value] : [])))} reps`;
      case 'time':
        return `${Math.max(...sets.flatMap(s => (s.type === 'time' ? [s.durationSec] : [])))} s`;
      case 'distance-time':
        return `${Math.max(...sets.flatMap(s => (s.type === 'distance-time' ? [s.distanceKm] : [])))} km`;
    }
  }

  private computeDelta(newSet: WorkedSet, prev: PersonalRecord | null): string | null {
    if (!prev) return null;
    switch (newSet.type) {
      case 'weight-reps': {
        const prevW = prev.set.type === 'weight-reps' ? prev.set.weight.value : 0;
        const diff = newSet.weight.value - prevW;
        return diff > 0 ? `+${this.formatWeightOf(newSet.exerciseId, diff)}` : null;
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

  private formatSetDetail(s: WorkedSet): string {
    switch (s.type) {
      case 'weight-reps':
        return `${this.formatWeightOf(s.exerciseId, s.weight.value)} × ${s.reps.value}`;
      case 'bodyweight-reps':
        return `${s.reps.value} reps`;
      case 'time':
        return `${s.durationSec} s`;
      case 'distance-time':
        return `${s.distanceKm} km`;
      default:
        return '—';
    }
  }
}
