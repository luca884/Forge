/**
 * ExerciseHistoryPage — /progress/exercise/:exerciseId (D-29).
 * Shows: current PR, estimated 1RM (weight-reps only), chart, recent sets.
 *
 * Reads exerciseId from route input signal (Angular 19 style).
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

@Component({
  selector: 'fg-exercise-history-page',
  standalone: true,
  imports: [ExerciseHistoryChartComponent],
  providers: [
    GetCurrentPRForExerciseUseCase,
    GetExerciseHistoryUseCase,
  ],
  template: `
    <div class="exercise-history">
      @if (loading()) {
        <p class="loading">Cargando...</p>
      } @else {
        <header class="exercise-header">
          <h1>{{ exercise()?.name ?? exerciseId() }}</h1>
          <p class="tracking-type">Tipo: {{ exercise()?.trackingType ?? '' }}</p>

          @if (currentPR(); as pr) {
            <div class="pr-card">
              <div class="pr-card__label">PR actual</div>
              <div class="pr-card__value">{{ formatValue(pr) }}</div>
              <div class="pr-card__date">{{ formatDate(pr.achievedAt) }}</div>

              @if (estimated1RM(); as orm) {
                <div class="pr-card__orm">
                  <span>1RM estimado (Epley):</span>
                  <strong>{{ orm }} kg</strong>
                </div>
              }
            </div>
          } @else {
            <p class="no-pr">Sin PR registrado todavía.</p>
          }
        </header>

        <section class="chart-section">
          @if (history().length > 0) {
            <fg-exercise-history-chart
              [sets]="history()"
              [trackingType]="exercise()?.trackingType ?? 'weight-reps'"
            />
          } @else {
            <p class="empty-state">Sin historial de series registradas. (D-29/S3)</p>
          }
        </section>

        <section class="recent-history">
          <h2>Historial reciente</h2>
          @if (recentHistory().length === 0) {
            <p class="empty-state">Sin series registradas.</p>
          } @else {
            <ul class="history-list">
              @for (set of recentHistory(); track set.id) {
                <li class="history-item">
                  <span class="history-item__date">{{ formatDate(set.createdAt) }}</span>
                  <span class="history-item__value">{{ formatWorkedSet(set) }}</span>
                  @if (set.isPR) {
                    <span class="history-item__pr-badge">PR</span>
                  }
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .exercise-history { padding: 1rem; }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
    .tracking-type { font-size: 0.85rem; color: #888; margin-bottom: 1rem; }

    .pr-card {
      border: 1px solid #4CAF50;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .pr-card__label { font-size: 0.8rem; color: #888; }
    .pr-card__value { font-size: 1.5rem; font-weight: bold; color: #4CAF50; }
    .pr-card__date { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
    .pr-card__orm { display: flex; gap: 0.5rem; align-items: center; font-size: 0.9rem; }
    .pr-card__orm strong { color: #2196F3; }

    .no-pr { color: #888; font-style: italic; }

    .chart-section { margin-bottom: 1.5rem; }

    h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
    .history-list { list-style: none; padding: 0; }
    .history-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .history-item__date { font-size: 0.85rem; color: #888; min-width: 6rem; }
    .history-item__value { flex: 1; }
    .history-item__pr-badge {
      font-size: 0.7rem;
      background: #4CAF50;
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
    }

    .loading, .empty-state { color: #888; text-align: center; padding: 2rem 0; }
  `,
})
export class ExerciseHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly getCurrentPR = inject(GetCurrentPRForExerciseUseCase);
  private readonly getHistory = inject(GetExerciseHistoryUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);

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

  /** Last 10 sets in reverse-chronological order for display */
  readonly recentHistory = computed<WorkedSet[]>(() =>
    [...this.history()].reverse().slice(0, 10),
  );

  ngOnInit(): void {
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

  formatValue(pr: PersonalRecord): string {
    return formatTrackingValue(pr.set);
  }

  formatWorkedSet(set: WorkedSet): string {
    return formatTrackingValue(set);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
