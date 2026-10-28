/**
 * ProgressHomePage — /progress (D-27, C-Progress).
 * Cuaderno: Constancia (heatmap), Récords personales (table), Volumen semanal, plus
 * the 30-day overview, per-exercise progress and PR counters.
 * Click a PR → /progress/exercise/:id. Every weight goes through the preferred unit.
 *
 * No ProgressStore (D-31 design note: read-only page-local signals).
 * Injects use cases + exercise repo via inject().
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { GetSessionHeatmapUseCase } from '../../domain/use-cases/get-session-heatmap.use-case';
import { GetDashboardOverviewUseCase } from '../../domain/use-cases/get-dashboard-overview.use-case';
import { GetWeeklyTrendUseCase } from '../../domain/use-cases/get-weekly-trend.use-case';
import { GetExerciseProgressListUseCase } from '../../domain/use-cases/get-exercise-progress-list.use-case';
import type { DashboardOverview } from '../../domain/models/dashboard-overview.model';
import type { WeeklyTrendPoint } from '../../domain/models/weekly-trend-point.model';
import type { ExerciseProgressEntry } from '../../domain/models/exercise-progress-entry.model';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { bestRecordPerExercise } from '../helpers/best-record-per-exercise';
import { formatBestSet } from '../helpers/format-tracking-value';
import { SessionHeatmapComponent } from '../components/session-heatmap.component';
import { DashboardOverviewComponent } from '../components/dashboard-overview/dashboard-overview.component';
import { WeeklyTrendChartComponent } from '../components/weekly-trend-chart/weekly-trend-chart.component';
import { ExerciseProgressListComponent } from '../components/exercise-progress-list/exercise-progress-list.component';
import {
  FgCardComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  ToastService,
} from '@core/shared/ui';

@Component({
  selector: 'fg-progress-home-page',
  standalone: true,
  imports: [
    SessionHeatmapComponent,
    DashboardOverviewComponent,
    WeeklyTrendChartComponent,
    ExerciseProgressListComponent,
    DisplayWeightPipe,
    FgCardComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
  ],
  providers: [
    GetAllPersonalRecordsUseCase,
    GetSessionHeatmapUseCase,
    GetDashboardOverviewUseCase,
    GetWeeklyTrendUseCase,
    GetExerciseProgressListUseCase,
  ],
  template: `
    <section class="bg-page text-ink flex flex-col gap-[14px] px-4 pt-5 pb-4">
      <header class="flex flex-col gap-0.5">
        @if (headerSubtitle(); as subtitle) {
          <span class="text-[13px] leading-[18px] font-medium text-ink-2">{{ subtitle }}</span>
        }
        <h1 class="text-[32px] leading-9 font-bold tracking-[-0.03em] text-ink">Progreso</h1>
      </header>

      <!-- Constancia -->
      <fg-card [padding]="12">
        <div class="flex items-baseline justify-between gap-2 mb-2.5">
          <h2 class="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Constancia</h2>
          <span class="font-mono tabular-nums text-xs text-ink">{{ sessionsLabel() }}</span>
        </div>
        <fg-session-heatmap [heatmapData]="heatmapData()"></fg-session-heatmap>
      </fg-card>

      <!-- Récords personales -->
      <section aria-labelledby="records-title">
        @if (loading()) {
          <fg-card>
            <fg-skeleton [height]="48"></fg-skeleton>
          </fg-card>
        } @else if (recentPRs().length === 0) {
          <h2 id="records-title" class="mb-2 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Récords personales</h2>
          <fg-empty-state
            icon="dumbbell"
            title="Aún no tenés PRs"
            body="Registra tu primer entrenamiento para empezar."
          ></fg-empty-state>
        } @else {
          <fg-card [padding]="0">
            <div class="flex items-baseline justify-between gap-2 px-3.5 pt-3 pb-2">
              <h2 id="records-title" class="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Récords personales</h2>
              <button
                type="button"
                class="py-1 text-[13px] font-medium text-accent-ink"
                (click)="navigateToPRList()"
              >{{ seeAllLabel() }}</button>
            </div>
            <div class="flex gap-2.5 px-3.5 pb-1.5 border-b border-line text-[11px] leading-[14px] font-semibold tracking-[0.06em] uppercase text-ink-2">
              <span class="flex-1 min-w-0">Ejercicio</span>
              <span class="w-[104px] shrink-0">Mejor</span>
              <span class="w-[68px] shrink-0 text-right">1RM</span>
            </div>
            <ul class="list-none m-0 p-0">
              @for (pr of recentPRs(); track pr.id) {
                <li class="border-b border-line-soft last:border-b-0">
                  <button
                    type="button"
                    data-testid="pr-row"
                    class="w-full flex items-center gap-2.5 min-h-12 px-3.5 py-1 text-left"
                    (click)="navigateToExercise(pr.exerciseId)"
                  >
                    <span class="flex-1 min-w-0 flex flex-col">
                      <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ exerciseName(pr.exerciseId) }}</span>
                      <span class="text-xs leading-4 text-ink-2">{{ formatShortDate(pr.achievedAt) }}</span>
                    </span>
                    <span class="w-[104px] shrink-0 font-mono tabular-nums text-[13px] text-ink">{{ bestSet(pr) }}</span>
                    <span class="w-[68px] shrink-0 text-right font-mono tabular-nums text-[13px] font-medium text-ink">
                      @if (estimated1RMKg(pr); as orm) { {{ orm | displayWeight: unit() }} } @else { — }
                    </span>
                  </button>
                </li>
              }
            </ul>
          </fg-card>
        }
      </section>

      <fg-weekly-trend-chart [points]="weeklyTrend()" [unit]="unit()"></fg-weekly-trend-chart>

      <fg-dashboard-overview [overview]="overview()" [loading]="loading()" [unit]="unit()"></fg-dashboard-overview>

      <fg-exercise-progress-list [entries]="progressEntries()" [unit]="unit()"></fg-exercise-progress-list>

      <!-- Stat cards (2-up grid) -->
      <div class="grid grid-cols-2 gap-3">
        <fg-card [padding]="14">
          <div class="font-mono tabular-nums text-2xl font-medium text-ink">{{ totalPRs() }}</div>
          <div class="text-xs leading-4 text-ink-2 mt-1">PRs totales</div>
        </fg-card>
        <fg-card [padding]="14">
          <div class="font-mono tabular-nums text-2xl font-medium text-accent-ink">{{ prsThisWeek() }}</div>
          <div class="text-xs leading-4 text-ink-2 mt-1">PRs esta semana</div>
        </fg-card>
      </div>
    </section>
  `,
})
export class ProgressHomePage implements OnInit {
  private readonly getAllPRs = inject(GetAllPersonalRecordsUseCase);
  private readonly getSessionHeatmap = inject(GetSessionHeatmapUseCase);
  private readonly getDashboardOverview = inject(GetDashboardOverviewUseCase);
  private readonly getWeeklyTrend = inject(GetWeeklyTrendUseCase);
  private readonly getExerciseProgressList = inject(GetExerciseProgressListUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly userPrefs = inject(UserPreferencesService);

  readonly unit = this.userPrefs.unit;

  readonly loading = signal(true);
  readonly allPRs = signal<PersonalRecord[]>([]);
  readonly heatmapData = signal<Map<string, number>>(new Map());
  readonly overview = signal<DashboardOverview | null>(null);
  readonly weeklyTrend = signal<WeeklyTrendPoint[]>([]);
  readonly progressEntries = signal<ExerciseProgressEntry[]>([]);
  private readonly exerciseMap = signal<Map<string, Exercise>>(new Map());

  /** Rows of "Récords personales": the five exercises with the most recent record, each with its best mark. */
  readonly recentPRs = computed(() => bestRecordPerExercise(this.allPRs()).slice(0, 5));
  readonly totalPRs = computed(() => this.allPRs().length);
  readonly prsThisWeek = computed(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    return this.allPRs().filter((pr) => pr.achievedAt >= weekStart).length;
  });

  readonly headerSubtitle = computed<string | undefined>(() => {
    const total = this.totalPRs();
    if (total === 0) return undefined;
    return `${total} PR · ${this.prsThisWeek()} esta semana`;
  });

  /** Sessions in the heatmap window ("N sesiones"). */
  readonly sessionsLabel = computed<string>(() => {
    let total = 0;
    for (const count of this.heatmapData().values()) total += count;
    return total === 1 ? '1 sesión' : `${total} sesiones`;
  });

  readonly seeAllLabel = computed<string>(() => {
    const total = this.totalPRs();
    return total > 1 ? `Ver los ${total}` : 'Ver todos';
  });

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const [prs, heatmap, exercises, overview, weeklyTrend, progressEntries] = await Promise.all([
        this.getAllPRs.execute(),
        this.getSessionHeatmap.execute(),
        this.exerciseRepo.getAll(),
        this.getDashboardOverview.execute(),
        this.getWeeklyTrend.execute(),
        this.getExerciseProgressList.execute(),
      ]);
      this.allPRs.set(prs);
      this.heatmapData.set(heatmap);
      this.overview.set(overview);
      this.weeklyTrend.set(weeklyTrend);
      this.progressEntries.set(progressEntries);
      const map = new Map<string, Exercise>(exercises.map((e) => [e.id, e]));
      this.exerciseMap.set(map);
    } catch {
      this.toast.error('No se pudo cargar el progreso', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseMap().get(exerciseId)?.name ?? exerciseId;
  }

  /** Best set in the preferred unit, compact: "100 kg × 5". */
  bestSet(pr: PersonalRecord): string {
    return formatBestSet(pr.set, this.unit());
  }

  /** Estimated 1RM of the PR set in kg (the template formats it with the preferred unit). */
  estimated1RMKg(pr: PersonalRecord): number | null {
    if (pr.set.type !== 'weight-reps') return null;
    const result = OneRepMax.tryFrom({ weightKg: pr.set.weight.value, reps: pr.set.reps.value });
    return result.ok ? Math.round(result.value.kg * 10) / 10 : null;
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  navigateToExercise(exerciseId: string): void {
    void this.router.navigate(['/progress/exercise', exerciseId]);
  }

  navigateToPRList(): void {
    void this.router.navigate(['/progress/prs']);
  }
}
