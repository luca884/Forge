/**
 * ExerciseHistoryPage — /progress/exercise/:exerciseId (D-29, D-1 redesign, C-Exercise).
 * Shows: back link, exercise name, summary tiles (1RM est., best set, sessions),
 * chart, session-grouped history. Every weight goes through the preferred unit.
 *
 * Reads exerciseId from route snapshot (single-load page, no hot-swap needed).
 * No dexie/data imports. Injects use cases and repos via inject().
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetCurrentPRForExerciseUseCase } from '../../domain/use-cases/get-current-pr-for-exercise.use-case';
import { GetExerciseHistoryUseCase } from '../../domain/use-cases/get-exercise-history.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { ExerciseHistoryChartComponent } from '../components/exercise-history-chart/exercise-history-chart.component';
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
  /** Σ weight × reps of the weight-reps sets, in kg. */
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
    GetCurrentPRForExerciseUseCase,
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
        <!-- 3-stat tile row -->
        <section
          aria-label="Resumen del ejercicio"
          class="grid grid-cols-3 bg-surface border border-line rounded-lg"
        >
          <div class="flex flex-col gap-1 p-2.5 border-r border-line-soft min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">1RM est.</span>
            <span data-stat="1rm" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink whitespace-nowrap">
              {{ estimated1RM() !== null ? (estimated1RM()! | displayWeight: unit()) : '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-1 p-2.5 border-r border-line-soft min-w-0">
            <span class="text-[10px] leading-3 font-semibold tracking-[0.08em] uppercase text-ink-2">Mejor serie</span>
            <span data-stat="best" class="font-mono tabular-nums text-[15px] leading-6 font-medium text-ink break-words">
              {{ bestSetText() ?? '—' }}
            </span>
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
              <h2 id="history-title" class="m-0 px-3.5 pt-3 pb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Historial</h2>
              <div class="flex gap-2.5 px-3.5 pb-1.5 border-b border-line text-[10px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2">
                <span class="w-[52px] shrink-0">Fecha</span>
                <span class="flex-1 min-w-0">Series ({{ unit() }} × reps)</span>
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
            </fg-card>
          }
        </section>
      }
    </section>
  `,
})
export class ExerciseHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly getCurrentPR = inject(GetCurrentPRForExerciseUseCase);
  private readonly getHistory = inject(GetExerciseHistoryUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly toast = inject(ToastService);

  readonly unit = this.userPrefs.unit;

  readonly loading = signal(true);
  readonly exerciseId = signal<string>('');
  readonly exercise = signal<Exercise | null>(null);
  readonly currentPR = signal<PersonalRecord | null>(null);
  readonly history = signal<WorkedSet[]>([]);

  readonly estimated1RM = computed<number | null>(() => {
    const pr = this.currentPR();
    if (!pr || pr.set.type !== 'weight-reps') return null;
    const result = OneRepMax.tryFrom({ weightKg: pr.set.weight.value, reps: pr.set.reps.value });
    return result.ok ? Math.round(result.value.kg * 10) / 10 : null;
  });

  /** Last 10 sessions in reverse-chronological order, grouped by sessionId. */
  readonly groupedHistory = computed<readonly SessionGroup[]>(() => {
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
        volumeKg: sets.reduce((sum, set) => sum + (set.type === 'weight-reps' ? set.weight.value * set.reps.value : 0), 0),
      });
    }
    return groups.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  });

  readonly sessionCount = computed<number>(() => new Set(this.history().map((s) => s.sessionId)).size);

  /** "Piernas · lb": muscle group and the unit the figures are shown in. */
  readonly metaText = computed<string>(() => {
    const ex = this.exercise();
    if (!ex) return '';
    return `${muscleGroupLabel(ex.muscleGroup)} · ${this.unit()}`;
  });

  /** The current PR set in the preferred unit ("100 kg × 5"), or null without a PR. */
  readonly bestSetText = computed<string | null>(() => {
    const pr = this.currentPR();
    return pr ? formatBestSet(pr.set, this.unit()) : null;
  });

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

      const trackingType = exercise?.trackingType ?? 'weight-reps';

      const [pr, history] = await Promise.all([
        this.getCurrentPR.execute(exerciseId, trackingType),
        this.getHistory.execute({ exerciseId }),
      ]);

      this.currentPR.set(pr);
      this.history.set(history);
    } catch {
      this.toast.error('No se pudo cargar el historial', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    void this.router.navigate(['/progress']);
  }

  formatValue(pr: PersonalRecord): string {
    return formatTrackingValue(pr.set, this.unit());
  }

  formatWorkedSet(set: WorkedSet): string {
    return formatTrackingValue(set, this.unit());
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** C-Exercise style: "27 oct". */
  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  /** "100 kg × 8 · 100 kg × 7": every set in the preferred unit. */
  joinSets(sets: readonly WorkedSet[]): string {
    return sets.map((s) => formatBestSet(s, this.unit())).join(' · ');
  }

  /** Session volume as a plain number in the preferred unit (the column header names the unit). */
  volumeText(group: SessionGroup): string {
    return group.volumeKg > 0 ? String(Math.round(displayWeightValue(group.volumeKg, this.unit()))) : '—';
  }
}
