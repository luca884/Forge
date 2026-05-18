/**
 * ProgressHomePage — /progress (D-27).
 * Shows session heatmap + last 5 PRs + summary stats. Click a PR → /progress/exercise/:id.
 *
 * No ProgressStore (D-31 design note: read-only page-local signals).
 * Injects use cases + exercise repo via inject().
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { GetAllPersonalRecordsUseCase } from '../../domain/use-cases/get-all-personal-records.use-case';
import { GetSessionHeatmapUseCase } from '../../domain/use-cases/get-session-heatmap.use-case';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { formatTrackingValue } from '../helpers/format-tracking-value';
import { SessionHeatmapComponent } from '../components/session-heatmap.component';
import {
  FgPageHeaderComponent,
  FgCardComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  FgButtonComponent,
  type PageHeaderAction,
} from '@core/shared/ui';

@Component({
  selector: 'fg-progress-home-page',
  standalone: true,
  imports: [
    SessionHeatmapComponent,
    FgPageHeaderComponent,
    FgCardComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
    FgButtonComponent,
  ],
  providers: [
    GetAllPersonalRecordsUseCase,
    GetSessionHeatmapUseCase,
  ],
  template: `
    <fg-page-header
      title="Progreso"
      [subtitle]="headerSubtitle()"
      [trailingActions]="trailingActions"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-4">
      <!-- Heatmap card -->
      <fg-card>
        <div class="t-micro text-forge-500 mb-3">ÚLTIMAS 12 SEMANAS</div>
        <fg-session-heatmap [heatmapData]="heatmapData()"></fg-session-heatmap>
      </fg-card>

      <!-- Stat cards (2-up grid) -->
      <div class="grid grid-cols-2 gap-3">
        <fg-card>
          <div class="t-h2 text-forge-50 tabular-nums">{{ totalPRs() }}</div>
          <div class="t-caption text-forge-500 mt-1">PRs totales</div>
        </fg-card>
        <fg-card>
          <div class="t-h2 text-accent-300 tabular-nums">{{ prsThisWeek() }}</div>
          <div class="t-caption text-forge-500 mt-1">PRs esta semana</div>
        </fg-card>
      </div>

      <!-- Recent PRs section -->
      <section>
        <div class="t-micro text-forge-500 mb-2">ÚLTIMOS PRS</div>
        @if (loading()) {
          <fg-card>
            <fg-skeleton [height]="48"></fg-skeleton>
          </fg-card>
        } @else if (recentPRs().length === 0) {
          <fg-empty-state
            icon="dumbbell"
            title="Aún no tenés PRs"
            body="Registra tu primer entrenamiento para empezar."
          ></fg-empty-state>
        } @else {
          <fg-card [padding]="0">
            @for (pr of recentPRs(); track pr.id) {
              <button
                type="button"
                class="w-full px-4 py-3 flex items-center justify-between
                       text-left border-b border-forge-800 last:border-b-0"
                (click)="navigateToExercise(pr.exerciseId)"
              >
                <span class="t-body text-forge-100">{{ exerciseName(pr.exerciseId) }}</span>
                <span class="t-body-sm text-accent-300 tabular-nums">{{ formatValue(pr) }}</span>
              </button>
            }
          </fg-card>
          <button
            fg-button
            variant="ghost"
            size="sm"
            class="mt-2 w-full"
            (click)="navigateToPRList()"
          >Ver todos los PRs</button>
        }
      </section>
    </div>
  `,
})
export class ProgressHomePage implements OnInit {
  private readonly getAllPRs = inject(GetAllPersonalRecordsUseCase);
  private readonly getSessionHeatmap = inject(GetSessionHeatmapUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly allPRs = signal<PersonalRecord[]>([]);
  readonly heatmapData = signal<Map<string, number>>(new Map());
  private readonly exerciseMap = signal<Map<string, Exercise>>(new Map());

  readonly recentPRs = computed(() => this.allPRs().slice(0, 5));
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

  readonly trailingActions: readonly PageHeaderAction[] = [
    {
      icon: 'calendar',
      ariaLabel: 'Calendario',
      click: () => this.openCalendar(),
    },
  ];

  openCalendar(): void {
    // noop — slice D conectará
  }

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const [prs, heatmap, exercises] = await Promise.all([
        this.getAllPRs.execute(),
        this.getSessionHeatmap.execute(),
        this.exerciseRepo.getAll(),
      ]);
      this.allPRs.set(prs);
      this.heatmapData.set(heatmap);
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
