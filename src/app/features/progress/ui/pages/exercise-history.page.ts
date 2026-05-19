/**
 * ExerciseHistoryPage — /progress/exercise/:exerciseId (D-29, D-1 redesign).
 * Shows: page header, current PR, estimated 1RM, chart, session-grouped recent sets.
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
import { formatTrackingValue } from '../helpers/format-tracking-value';
import { muscleGroupLabel } from '../helpers/muscle-group-label';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import {
  FgPageHeaderComponent,
  FgCardComponent,
  FgChipComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
} from '@core/shared/ui';

/** Session grouping — local interface, single-file use. */
interface SessionGroup {
  readonly sessionId: string;
  /** first-set timestamp semantics; if needed in future, promote to GetSessionsForExerciseUseCase */
  readonly date: Date;
  readonly sets: readonly WorkedSet[];
  readonly hasPR: boolean;
}

@Component({
  selector: 'fg-exercise-history-page',
  standalone: true,
  imports: [
    ExerciseHistoryChartComponent,
    DisplayWeightPipe,
    FgPageHeaderComponent,
    FgCardComponent,
    FgChipComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
  ],
  providers: [
    GetCurrentPRForExerciseUseCase,
    GetExerciseHistoryUseCase,
  ],
  template: `
    <fg-page-header
      [title]="'Historial'"
      [subtitle]="subtitleText()"
      leadingIcon="chevron-left"
      (leadingClick)="goBack()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-4">
      @if (loading()) {
        <fg-card><fg-skeleton [height]="180"></fg-skeleton></fg-card>
      } @else {
        <!-- Chart en card -->
        @if (history().length > 0) {
          <fg-card [padding]="16">
            <fg-exercise-history-chart
              [sets]="history()"
              [trackingType]="exercise()?.trackingType ?? 'weight-reps'"
              [unit]="unit()"
            ></fg-exercise-history-chart>
          </fg-card>
        }

        <!-- 3-stat tile row -->
        <div class="grid grid-cols-3 gap-2">
          <fg-card [padding]="12">
            <div class="t-micro text-forge-500">Mejor</div>
            <div class="t-h2 text-forge-50 t-num mt-1">
              {{ bestWeightKg() !== null ? (bestWeightKg()! | displayWeight: unit()) : '—' }}
            </div>
          </fg-card>
          <fg-card [padding]="12">
            <div class="t-micro text-forge-500">Mejor reps</div>
            <div class="t-h2 text-forge-50 t-num mt-1">{{ bestReps() ?? '—' }}</div>
          </fg-card>
          <fg-card [padding]="12">
            <div class="t-micro text-forge-500">1RM est.</div>
            <div class="t-h2 text-accent-300 t-num mt-1">
              {{ estimated1RM() !== null ? (estimated1RM()! | displayWeight: unit()) : '—' }}
            </div>
          </fg-card>
        </div>

        <!-- Últimos sets (session-grouped) -->
        <section>
          <div class="t-micro text-forge-500 mb-2">ÚLTIMOS SETS</div>
          @if (groupedHistory().length === 0) {
            <fg-empty-state icon="dumbbell" title="Sin series registradas" body="Empezá a entrenar para ver tu historial."></fg-empty-state>
          } @else {
            <fg-card [padding]="0">
              @for (group of groupedHistory(); track group.sessionId; let last = $last) {
                <div class="flex items-center gap-3 px-3.5 py-3"
                     [class.border-b]="!last"
                     [class.border-forge-800]="!last">
                  <div class="w-14 shrink-0 t-caption text-forge-500">{{ formatShortDate(group.date) }}</div>
                  <div class="flex-1 t-body-sm text-forge-100 tabular-nums">
                    {{ joinSets(group.sets) }}
                  </div>
                  @if (group.hasPR) {
                    <fg-chip size="sm" [active]="true">PR</fg-chip>
                  }
                </div>
              }
            </fg-card>
          }
        </section>
      }
    </div>
  `,
})
export class ExerciseHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly getCurrentPR = inject(GetCurrentPRForExerciseUseCase);
  private readonly getHistory = inject(GetExerciseHistoryUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);

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
    return result.ok ? result.value.kg : null;
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
      });
    }
    return groups.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  });

  readonly subtitleText = computed<string>(() => {
    const ex = this.exercise();
    if (!ex) return '';
    const count = new Set(this.history().map((s) => s.sessionId)).size;
    return `${muscleGroupLabel(ex.muscleGroup)} · ${count} sesiones`;
  });

  readonly bestWeightKg = computed<number | null>(() => {
    const wr = this.history().filter(
      (s): s is Extract<WorkedSet, { type: 'weight-reps' }> => s.type === 'weight-reps',
    );
    if (wr.length === 0) return null;
    return Math.max(...wr.map((s) => s.weight.value));
  });

  readonly bestReps = computed<number | null>(() => {
    const wr = this.history().filter(
      (s): s is Extract<WorkedSet, { type: 'weight-reps' }> => s.type === 'weight-reps',
    );
    if (wr.length === 0) return null;
    return Math.max(...wr.map((s) => s.reps.value));
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

  /** exercise-history style: "Hoy", "Ayer", or "Vie 12" short day format */
  formatShortDate(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' });
  }

  joinSets(sets: readonly WorkedSet[]): string {
    return sets.map((s) => formatTrackingValue(s, this.unit())).join(', ');
  }
}
