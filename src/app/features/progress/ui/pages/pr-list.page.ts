/**
 * PRListPage — /progress/prs (D-28, D-2 redesign, Cuaderno language).
 * Full list of all PRs, with filters Todos/Recientes-30d.
 * Click a PR → /progress/exercise/:exerciseId.
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { GetExercisesMapUseCase } from '@features/exercises/domain/use-cases/get-exercises-map.use-case';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { formatTrackingValue } from '../helpers/format-tracking-value';
import { muscleGroupLabel } from '../helpers/muscle-group-label';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import {
  FgCardComponent,
  FgIconComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  ToastService,
} from '@core/shared/ui';

type PRFilter = 'all' | 'recent-30d';

@Component({
  selector: 'fg-pr-list-page',
  standalone: true,
  imports: [
    FgCardComponent,
    FgIconComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
  ],
  providers: [GetAllPersonalRecordsUseCase, GetExercisesMapUseCase],
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
        @if (headerSubtitle(); as subtitle) {
          <span class="text-[13px] leading-[18px] font-medium text-ink-2">{{ subtitle }}</span>
        }
        <h1 class="text-[30px] leading-9 font-bold tracking-[-0.03em] text-ink">Records personales</h1>
      </header>

      <!-- Filters -->
      <div role="group" aria-label="Filtro" class="flex gap-0.5">
        <button
          type="button"
          [class]="filterClass('all')"
          [attr.aria-pressed]="activeFilter() === 'all'"
          (click)="setFilter('all')"
        >Todos</button>
        <button
          type="button"
          [class]="filterClass('recent-30d')"
          [attr.aria-pressed]="activeFilter() === 'recent-30d'"
          (click)="setFilter('recent-30d')"
        >Recientes</button>
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
                [class.bg-accent-soft]="isRecent(pr)"
                [class.text-accent-ink]="isRecent(pr)"
                [class.bg-empty]="!isRecent(pr)"
                [class.text-ink-2]="!isRecent(pr)"
              >
                <fg-icon
                  [name]="isRecent(pr) ? 'flame' : 'trophy'"
                  [size]="18"
                ></fg-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[15px] leading-5 text-ink font-medium truncate">{{ exerciseName(pr.exerciseId) }}</div>
                <div class="text-[13px] leading-[18px] text-ink-2 mt-0.5">
                  {{ muscleLabel(pr.exerciseId) }} · {{ formatRelativeDate(pr.achievedAt) }}
                </div>
              </div>
              <div class="font-mono text-[13px] text-ink font-medium tabular-nums">
                {{ formatValue(pr) }}
              </div>
            </button>
          </fg-card>
        }
      }
    </section>
  `,
})
export class PRListPage implements OnInit {
  private readonly getAllPRs = inject(GetAllPersonalRecordsUseCase);
  private readonly getExercisesMap = inject(GetExercisesMapUseCase);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly toast = inject(ToastService);

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
      const [prs, exerciseMap] = await Promise.all([
        this.getAllPRs.execute(),
        this.getExercisesMap.execute(),
      ]);
      this.prs.set(prs);
      this.exerciseMap.set(exerciseMap);
    } catch {
      this.toast.error('No se pudieron cargar los records', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(f: PRFilter): void {
    this.activeFilter.set(f);
  }

  protected filterClass(f: PRFilter): string {
    return `h-[30px] px-2.5 border-0 rounded-md text-xs cursor-pointer ${
      this.activeFilter() === f ? 'bg-accent-soft text-accent-ink font-semibold' : 'bg-transparent text-ink-2 font-medium'
    }`;
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
    return formatTrackingValue(pr.set, this.unit(), this.exerciseMap().get(pr.exerciseId)?.weightUnit);
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
