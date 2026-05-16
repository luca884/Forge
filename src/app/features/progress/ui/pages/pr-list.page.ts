/**
 * PRListPage — /progress/prs (D-28).
 * Full list of all PRs, ordered by achievedAt DESC.
 * Click a PR → /progress/exercise/:exerciseId.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { formatTrackingValue } from '../helpers/format-tracking-value';
import { UserPreferencesService } from '@core/profile/user-preferences.service';

@Component({
  selector: 'fg-pr-list-page',
  standalone: true,
  providers: [GetAllPersonalRecordsUseCase],
  template: `
    <div class="pr-list-page">
      <h1>Todos los PRs</h1>

      @if (loading()) {
        <p class="loading">Cargando...</p>
      } @else if (prs().length === 0) {
        <p class="empty-state">Aún no tenés PRs registrados. ¡A entrenar!</p>
      } @else {
        <ul class="pr-list">
          @for (pr of prs(); track pr.id) {
            <li
              class="pr-item"
              role="button"
              tabindex="0"
              (click)="navigateToExercise(pr.exerciseId)"
              (keydown.enter)="navigateToExercise(pr.exerciseId)"
              (keydown.space)="navigateToExercise(pr.exerciseId)"
            >
              <div class="pr-item__name">{{ exerciseName(pr.exerciseId) }}</div>
              <div class="pr-item__details">
                <span class="pr-item__value">{{ formatValue(pr) }}</span>
                <span class="pr-item__date">{{ formatDate(pr.achievedAt) }}</span>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .pr-list-page { padding: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }

    .pr-list { list-style: none; padding: 0; margin: 0; }
    .pr-item {
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }
    .pr-item:hover { background: #f9f9f9; }
    .pr-item__name { font-weight: 500; margin-bottom: 0.25rem; }
    .pr-item__details {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }
    .pr-item__value { color: #4CAF50; font-weight: bold; }
    .pr-item__date { color: #888; }

    .loading, .empty-state { color: #888; text-align: center; padding: 2rem 0; }
  `,
})
export class PRListPage implements OnInit {
  private readonly getAllPRs = inject(GetAllPersonalRecordsUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);

  readonly unit = this.userPrefs.unit;

  readonly loading = signal(true);
  readonly prs = signal<PersonalRecord[]>([]);
  private readonly exerciseMap = signal<Map<string, Exercise>>(new Map());

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const [prs, exercises] = await Promise.all([
        this.getAllPRs.execute(),
        this.exerciseRepo.getAll(),
      ]);
      this.prs.set(prs);
      this.exerciseMap.set(new Map(exercises.map((e) => [e.id, e])));
    } finally {
      this.loading.set(false);
    }
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseMap().get(exerciseId)?.name ?? exerciseId;
  }

  formatValue(pr: PersonalRecord): string {
    return formatTrackingValue(pr.set, this.unit());
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  navigateToExercise(exerciseId: string): void {
    void this.router.navigate(['/progress/exercise', exerciseId]);
  }
}
