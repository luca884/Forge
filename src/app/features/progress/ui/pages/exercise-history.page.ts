/**
 * ExerciseHistoryPage — /progress/exercise/:exerciseId (D-29, D-1 redesign, C-Exercise).
 * Shows: back link, exercise name, summary tiles (1RM est., best set, max reps, sessions),
 * chart, session-grouped history. Every weight goes through the preferred unit.
 * The 1RM, the best set and the max reps are computed from the registered sets, not from the PR table.
 *
 * Reads exerciseId from route snapshot (single-load page, no hot-swap needed).
 * No dexie/data imports. Injects use cases and repos via inject().
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import { loadKg } from '@core/shared/domain/weight-unit';
import { GetExerciseHistoryUseCase } from '../../domain/use-cases/get-exercise-history.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { ExerciseHistoryChartComponent } from '../components/exercise-history-chart/exercise-history-chart.component';
import { bestSetOf, maxRepsOf } from '../helpers/best-set';
import { formatBestSet, formatTrackingValue } from '../helpers/format-tracking-value';
import { muscleGroupLabel } from '../helpers/muscle-group-label';
import { displayWeightValue } from '../helpers/weight-display';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import {
  FgCardComponent,
  FgChipComponent,
  FgIconComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  ToastService,
} from '@core/shared/ui';

/** Session grouping — local interface, single-file use. */
interface SessionGroup {
  readonly sessionId: string;
  /** first-set timestamp semantics; if needed in future, promote to GetSessionsForExerciseUseCase */
  readonly date: Date;
  readonly sets: readonly WorkedSet[];
  readonly hasPR: boolean;
  /** Σ load × reps of the weight-reps sets, in kg (a plates set weighs plates × plate weight). */
  readonly volumeKg: number;
}

@Component({
  selector: 'fg-exercise-history-page',
  standalone: true,
  imports: [
    ExerciseHistoryChartComponent,
    DisplayWeightPipe,
    FgCardComponent,
    FgChipComponent,
    FgIconComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
  ],
  providers: [
    GetExerciseHistoryUseCase,
  ],
  template: `
    <section class="bg-page text-ink flex flex-col gap-3 px-4 pt-1 pb-6">
      <button
        type="button"
        aria-label="Volver"
        class="self-start -ml-2 h-11 px-2 flex items-center gap-0.5 text-[15px] font-medium text-ink"
        (click)="goBack()"
      >
        <fg-icon name="chevron-left" [size]="20"></fg-icon>
        <span>Progreso</span>
      </button>

      <header class="flex flex-col gap-0.5">
        <h1 class="text-[30px] leading-9 font-bold tracking-[-0.03em] text-ink">{{ exercise()?.name ?? 'Historial' }}</h1>
        @if (metaText(); as meta) {
          <span data-exercise-meta class="font-mono text-xs text-ink-2">{{ meta }}</span>
        }
      </header>

      @if (loading()) {
        <fg-card><fg-skeleton [height]="180"></fg-skeleton></fg-card>
      } @else {
        <!-- Summary tiles, two per row so "220.5 lb × 12" fits on one line at 390 px -->
        <section
          aria-label="Resumen del ejercicio"
          class="grid grid-cols-2 bg-surface border border-line rounded-lg"
        >
          <div class="flex flex-col gap-1 p-2.5 border-r border-b border-line-soft min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">1RM est.</span>
            <span data-stat="1rm" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink whitespace-nowrap">
              {{ estimated1RM() !== null ? (estimated1RM()! | displayWeight: unit()) : '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-1 p-2.5 border-b border-line-soft min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Mejor serie</span>
            <span data-stat="best" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink break-words">
              {{ bestSetText() ?? '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-1 p-2.5 border-r border-line-soft min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Reps máx.</span>
            <span data-stat="max-reps" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink">{{ maxReps() ?? '—' }}</span>
          </div>
          <div class="flex flex-col gap-1 p-2.5 min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Sesiones</span>
            <span data-stat="sessions" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink">{{ sessionCount() }}</span>
          </div>
        </section>

        <!-- Chart en card -->
        @if (history().length > 0) {
          <fg-card [padding]="14">
            <fg-exercise-history-chart
              [sets]="history()"
              [trackingType]="exercise()?.trackingType ?? 'weight-reps'"
              [unit]="unit()"
              [exercise]="exercise()"
            ></fg-exercise-history-chart>
          </fg-card>
        }

        <!-- Historial (session-grouped) -->
        <section aria-labelledby="history-title">
          @if (groupedHistory().length === 0) {
            <h2 id="history-title" class="mb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Historial</h2>
            <fg-empty-state icon="dumbbell" title="Sin series registradas" body="Empezá a entrenar para ver tu historial."></fg-empty-state>
          } @else {
            <fg-card [padding]="0">
              <div class="flex items-baseline justify-between gap-2 px-3.5 pt-3 pb-2">
                <h2 id="history-title" class="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Historial</h2>
                @if (cutShort()) {
                  <span data-history-notice class="font-mono tabular-nums text-xs text-ink-2">Últimas {{ historyLimit }} de {{ sessionTotal() }}</span>
                }
              </div>
              <div class="flex gap-2.5 px-3.5 pb-1.5 border-b border-line text-[10px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2">
                <span class="w-[52px] shrink-0">Fecha</span>
                <span class="flex-1 min-w-0">{{ setsHeader() }}</span>
                <span class="w-[52px] shrink-0 text-right">Vol.</span>
              </div>
              @for (group of groupedHistory(); track group.sessionId; let last = $last) {
                <div class="flex items-center gap-2.5 px-3.5 py-2"
                     [class.border-b]="!last"
                     [class.border-line-soft]="!last">
                  <div class="w-[52px] shrink-0 flex flex-col items-start gap-0.5">
                    <span class="font-mono text-[13px] text-ink">{{ formatShortDate(group.date) }}</span>
                    @if (group.hasPR) {
                      <fg-chip size="sm" [active]="true">PR</fg-chip>
                    }
                  </div>
                  <div class="flex-1 min-w-0 font-mono tabular-nums text-xs leading-[18px] text-ink">
                    {{ joinSets(group.sets) }}
                  </div>
                  <div data-session-volume class="w-[52px] shrink-0 text-right font-mono tabular-nums text-xs text-ink-2">{{ volumeText(group) }}</div>
                </div>
              }
              @if (cutShort()) {
                <button
                  type="button"
                  class="w-full min-h-11 border-t border-line-soft text-[13px] font-medium text-accent-ink"
                  (click)="showAll.set(true)"
                >Ver todas</button>
              }
            </fg-card>
          }
        </section>
      }
    </section>
  `,
})
export class ExerciseHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly getHistory = inject(GetExerciseHistoryUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly toast = inject(ToastService);

  readonly unit = this.userPrefs.unit;

  readonly loading = signal(true);
  readonly exerciseId = signal<string>('');
  readonly exercise = signal<Exercise | null>(null);
  readonly history = signal<WorkedSet[]>([]);

  /**
   * Epley 1RM of the same set "Mejor serie" shows, so the two tiles never contradict each other.
   * In kg: over `loadKg`, so a plates exercise counts plates × plate weight (S11).
   */
  readonly estimated1RM = computed<number | null>(() => {
    const best = bestSetOf(this.history());
    if (!best || best.type !== 'weight-reps') return null;
    const weightKg = loadKg(best.weight.value, this.exercise());
    const result = OneRepMax.tryFrom({ weightKg, reps: best.reps.value });
    return result.ok ? Math.round(result.value.kg * 10) / 10 : null;
  });

  /** Sessions shown before the user asks for all of them. */
  protected readonly historyLimit = 10;
  /** "Ver todas" was tapped: the list is no longer cut at `historyLimit`. */
  protected readonly showAll = signal(false);

  /** Every session in reverse-chronological order, grouped by sessionId. */
  private readonly allSessions = computed<readonly SessionGroup[]>(() => {
    const exercise = this.exercise();
    const byId = new Map<string, WorkedSet[]>();
    for (const set of this.history()) {
      const list = byId.get(set.sessionId) ?? [];
      list.push(set);
      byId.set(set.sessionId, list);
    }
    const groups: SessionGroup[] = [];
    for (const [sessionId, sets] of byId) {
      if (sets.length === 0) continue;
      groups.push({
        sessionId,
        date: sets[0]!.createdAt,
        sets,
        hasPR: sets.some((s) => s.isPR),
        volumeKg: sets.reduce(
          (sum, set) => sum + (set.type === 'weight-reps' ? loadKg(set.weight.value, exercise) * set.reps.value : 0),
          0,
        ),
      });
    }
    return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  /** The sessions listed: the latest `historyLimit`, or all of them after "Ver todas". */
  readonly groupedHistory = computed<readonly SessionGroup[]>(() =>
    this.showAll() ? this.allSessions() : this.allSessions().slice(0, this.historyLimit),
  );

  protected readonly sessionTotal = computed<number>(() => this.allSessions().length);

  /** The list hides older sessions: show the "Últimas 10 de N" notice and "Ver todas". */
  protected readonly cutShort = computed<boolean>(() => !this.showAll() && this.sessionTotal() > this.historyLimit);

  readonly sessionCount = computed<number>(() => new Set(this.history().map((s) => s.sessionId)).size);

  /** "Piernas · lb": muscle group and the unit the figures are shown in. */
  readonly metaText = computed<string>(() => {
    const ex = this.exercise();
    if (!ex) return '';
    return `${muscleGroupLabel(ex.muscleGroup)} · ${this.unit()}`;
  });

  /**
   * "Mejor serie" in the preferred unit ("100 kg × 5", or "7 placas × 5" on a plates exercise),
   * or null without sets. Taken from the registered sets (heaviest, more reps on a tie):
   * a PR row can be missing or stale.
   */
  readonly bestSetText = computed<string | null>(() => {
    const best = bestSetOf(this.history());
    return best ? formatBestSet(best, this.unit(), this.exercise()?.weightUnit) : null;
  });

  /**
   * "Series (lb × reps)" for weight-reps, "Series (placas × reps)" on a plates exercise;
   * plain "Series" for the rest, whose sets carry their own unit.
   */
  readonly setsHeader = computed<string>(() => {
    const exercise = this.exercise();
    if ((exercise?.trackingType ?? 'weight-reps') !== 'weight-reps') return 'Series';
    return `Series (${exercise?.weightUnit === 'plates' ? 'placas' : this.unit()} × reps)`;
  });

  /** "Reps máx.": the most reps of any registered set, whatever its weight. */
  readonly maxReps = computed<number | null>(() => maxRepsOf(this.history()));

  /** Last 10 sets in reverse-chronological order for display (kept for backward compat) */
  readonly recentHistory = computed<WorkedSet[]>(() =>
    [...this.history()].reverse().slice(0, 10),
  );

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    const id = this.route.snapshot.paramMap.get('exerciseId') ?? '';
    this.exerciseId.set(id);
    void this.init(id);
  }

  private async init(exerciseId: string): Promise<void> {
    try {
      const exercise = await this.exerciseRepo.getById(exerciseId);
      this.exercise.set(exercise);

      this.history.set(await this.getHistory.execute({ exerciseId }));
    } catch {
      this.toast.error('No se pudo cargar el historial', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    void this.router.navigate(['/progress']);
  }

  formatWorkedSet(set: WorkedSet): string {
    return formatTrackingValue(set, this.unit(), this.exercise()?.weightUnit);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** C-Exercise style: "27 oct". */
  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  /** "100 kg × 8 · 100 kg × 7": every set in the preferred unit ("7 placas × 5" on a plates exercise). */
  joinSets(sets: readonly WorkedSet[]): string {
    const weightUnit = this.exercise()?.weightUnit;
    return sets.map((s) => formatBestSet(s, this.unit(), weightUnit)).join(' · ');
  }

  /** Session volume as a plain number in the preferred unit (the column header names the unit). */
  volumeText(group: SessionGroup): string {
    return group.volumeKg > 0 ? String(Math.round(displayWeightValue(group.volumeKg, this.unit()))) : '—';
  }
}
