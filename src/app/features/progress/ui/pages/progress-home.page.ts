/**
 * ProgressHomePage — /progress (D-27).
 * Shows last 5 PRs + summary stats. Click a PR → /progress/exercise/:id.
 *
 * No ProgressStore (D-31 design note: read-only page-local signals).
 * Injects use cases + exercise repo via inject().
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { formatTrackingValue } from '../helpers/format-tracking-value';

@Component({
  selector: 'fg-progress-home-page',
  standalone: true,
  providers: [
    GetAllPersonalRecordsUseCase,
  ],
  template: `
    <div class="progress-home">
      <h1>Progreso</h1>

      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ totalPRs() }}</span>
          <span class="stat-label">PRs totales</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ prsThisWeek() }}</span>
          <span class="stat-label">PRs esta semana</span>
        </div>
      </div>

      <section class="recent-prs">
        <h2>Últimos PRs</h2>

        @if (loading()) {
          <p class="loading">Cargando...</p>
        } @else if (recentPRs().length === 0) {
          <p class="empty-state">Aún no tenés PRs registrados. ¡A entrenar!</p>
        } @else {
          <ul class="pr-list">
            @for (pr of recentPRs(); track pr.id) {
              <li class="pr-item" (click)="navigateToExercise(pr.exerciseId)" role="button">
                <div class="pr-item__name">{{ exerciseName(pr.exerciseId) }}</div>
                <div class="pr-item__value">{{ formatValue(pr) }}</div>
                <div class="pr-item__date">{{ formatDate(pr.achievedAt) }}</div>
              </li>
            }
          </ul>
          <button class="view-all-btn" (click)="navigateToPRList()">Ver todos los PRs</button>
        }
      </section>
    </div>
  `,
  styles: `
    .progress-home {
      padding: 1rem;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }

    .stats-cards {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: #4CAF50; }
    .stat-label { font-size: 0.8rem; color: #666; }

    .pr-list { list-style: none; padding: 0; margin: 0; }
    .pr-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }
    .pr-item:hover { background: #f9f9f9; }
    .pr-item__name { font-weight: 500; flex: 1; }
    .pr-item__value { color: #4CAF50; font-weight: bold; margin: 0 1rem; }
    .pr-item__date { font-size: 0.8rem; color: #888; }

    .loading, .empty-state { color: #888; text-align: center; padding: 2rem 0; }
    .view-all-btn {
      margin-top: 1rem;
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #4CAF50;
      border-radius: 4px;
      background: transparent;
      color: #4CAF50;
      cursor: pointer;
    }
  `,
})
export class ProgressHomePage implements OnInit {
  private readonly getAllPRs = inject(GetAllPersonalRecordsUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly allPRs = signal<PersonalRecord[]>([]);
  private readonly exerciseMap = signal<Map<string, Exercise>>(new Map());

  readonly recentPRs = computed(() => this.allPRs().slice(0, 5));
  readonly totalPRs = computed(() => this.allPRs().length);
  readonly prsThisWeek = computed(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    return this.allPRs().filter((pr) => pr.achievedAt >= weekStart).length;
  });

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const prs = await this.getAllPRs.execute();
      this.allPRs.set(prs as PersonalRecord[]);

      // Load exercise names for display
      const exercises = await this.exerciseRepo.getAll();
      const map = new Map<string, Exercise>(exercises.map((e) => [e.id, e]));
      this.exerciseMap.set(map);
    } finally {
      this.loading.set(false);
    }
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseMap().get(exerciseId)?.name ?? exerciseId;
  }

  formatValue(pr: PersonalRecord): string {
    return formatTrackingValue(pr.set);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  navigateToExercise(exerciseId: string): void {
    void this.router.navigate(['/progress/exercise', exerciseId]);
  }

  navigateToPRList(): void {
    void this.router.navigate(['/progress/prs']);
  }
}
