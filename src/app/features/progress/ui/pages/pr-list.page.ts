/**
 * PRListPage — /progress/prs (D-28, D-2 redesign).
 * Full list of all PRs, with filter chips Todos/Recientes-30d.
 * Click a PR → /progress/exercise/:exerciseId.
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { formatTrackingValue } from '../helpers/format-tracking-value';
import { muscleGroupLabel } from '../helpers/muscle-group-label';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import {
  FgPageHeaderComponent,
  FgCardComponent,
  FgChipComponent,
  FgIconComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
} from '@core/shared/ui';

type PRFilter = 'all' | 'recent-30d';

@Component({
  selector: 'fg-pr-list-page',
  standalone: true,
  imports: [
    FgPageHeaderComponent,
    FgCardComponent,
    FgChipComponent,
    FgIconComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
  ],
  providers: [GetAllPersonalRecordsUseCase],
  template: `
    <fg-page-header
      title="Records personales"
      [subtitle]="headerSubtitle()"
      leadingIcon="chevron-left"
      (leadingClick)="goBack()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-3">
      <!-- Filter chips -->
      <div class="flex gap-1.5">
        <fg-chip [active]="activeFilter() === 'all'" (tap)="setFilter('all')">Todos</fg-chip>
        <fg-chip [active]="activeFilter() === 'recent-30d'" (tap)="setFilter('recent-30d')">Recientes</fg-chip>
      </div>

      @if (loading()) {
        <fg-card><fg-skeleton [height]="68"></fg-skeleton></fg-card>
      } @else if (filteredPRs().length === 0) {
        @if (activeFilter() === 'recent-30d') {
          <fg-empty-state icon="flame" title="Sin PRs en los últimos 30 días" body="Seguí entrenando para batir tus marcas."></fg-empty-state>
        } @else {
          <fg-empty-state icon="trophy" title="Aún no tenés PRs" body="Registra tu primer entrenamiento para empezar."></fg-empty-state>
        }
      } @else {
        @for (pr of filteredPRs(); track pr.id) {
          <fg-card [padding]="14">
            <button
              type="button"
              class="w-full flex items-center gap-3.5 text-left"
              (click)="navigateToExercise(pr.exerciseId)"
            >
              <div
                class="w-11 h-11 rounded-[10px] shrink-0 flex items-center justify-center"
                [class.bg-forge-850]="!isRecent(pr)"
                [class.text-forge-400]="!isRecent(pr)"
              >
                <fg-icon
                  [name]="isRecent(pr) ? 'flame' : 'trophy'"
                  [size]="18"
                ></fg-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="t-body text-forge-100 font-medium truncate">{{ exerciseName(pr.exerciseId) }}</div>
                <div class="t-body-sm text-forge-500 mt-0.5">
                  {{ muscleLabel(pr.exerciseId) }} · {{ formatRelativeDate(pr.achievedAt) }}
                </div>
              </div>
              <div class="t-num text-forge-50 font-semibold tabular-nums">
                {{ formatValue(pr) }}
              </div>
            </button>
          </fg-card>
        }
      }
    </div>
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
  readonly exerciseMap = signal<Map<string, Exercise>>(new Map());

  readonly activeFilter = signal<PRFilter>('all');

  readonly filteredPRs = computed<readonly PersonalRecord[]>(() => {
    const all = this.prs();
    if (this.activeFilter() === 'all') return all;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return all.filter((pr) => pr.achievedAt >= cutoff);
  });

  readonly headerSubtitle = computed<string | undefined>(() => {
    const total = this.prs().length;
    if (total === 0) return undefined;
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = this.prs().filter((pr) => pr.achievedAt >= cutoff).length;
    return `${total} PR · ${thisWeek} esta semana`;
  });

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

  setFilter(f: PRFilter): void {
    this.activeFilter.set(f);
  }

  goBack(): void {
    void this.router.navigate(['/progress']);
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseMap().get(exerciseId)?.name ?? exerciseId;
  }

  muscleLabel(exerciseId: string): string {
    return muscleGroupLabel(this.exerciseMap().get(exerciseId)?.muscleGroup ?? 'full-body');
  }

  isRecent(pr: PersonalRecord): boolean {
    return (Date.now() - pr.achievedAt.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }

  navigateToExercise(exerciseId: string): void {
    void this.router.navigate(['/progress/exercise', exerciseId]);
  }

  formatValue(pr: PersonalRecord): string {
    return formatTrackingValue(pr.set, this.unit());
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** pr-list style relative date: "Hoy", "Ayer", "Hace N días", "Hace 1 sem", "Hace N sem", "DD mmm" */
  formatRelativeDate(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 14) return 'Hace 1 sem';
    if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }
}
