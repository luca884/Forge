import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { WorkedSet } from '../../domain/worked-set';
import { Session } from '../../domain/session.entity';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { FgButtonComponent, FgCardComponent, FgChipComponent, FgIconComponent, ToastService } from '@core/shared/ui';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';

/** Format elapsed seconds as M:SS or H:MM:SS */
function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${m}m ${ss}s`;
}

interface ExerciseRow {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  hasPR: boolean;
}

interface PrRow {
  exerciseId: string;
  exerciseName: string;
  set: WorkedSet;
  delta: string | null;
  detail: string;
}

@Component({
  selector: 'fg-session-summary-page',
  standalone: true,
  imports: [DisplayWeightPipe, FgButtonComponent, FgCardComponent, FgChipComponent, FgIconComponent],
  template: `
    <div class="min-h-screen bg-forge-950 text-forge-100 flex flex-col">
      <header class="sticky top-0 z-10 px-5 pt-1 pb-3 bg-forge-950">
        <div class="flex items-center justify-between">
          <button fg-button variant="ghost" size="sm" leadingIcon="x"
                  (click)="goHome()" aria-label="Cerrar">
          </button>
          <div class="text-center flex-1">
            <div class="t-body text-forge-100 font-semibold">Sesión completada</div>
            <div class="t-caption text-forge-500 mt-0.5">{{ subtitle() }}</div>
          </div>
          <div class="w-10"></div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto px-5 pb-24 pt-3 flex flex-col gap-4">
        <!-- Volume hero -->
        <fg-card [padding]="20" class="relative overflow-hidden">
          <div class="absolute inset-0 pointer-events-none"
               style="background: radial-gradient(80% 60% at 50% 0%, rgba(var(--accent-rgb),0.18), transparent 60%);">
          </div>
          <div class="relative text-center">
            <div class="t-micro" style="color: var(--accent-text);">VOLUMEN TOTAL</div>
            <div class="t-display text-forge-50 mt-2 tabular-nums">
              {{ volumeValue() }} <span class="text-2xl text-forge-300">kg</span>
            </div>
            @if (!hasVolume()) {
              <div class="t-body-sm text-forge-500 mt-1">Sin volumen registrado</div>
            }
          </div>
        </fg-card>

        <!-- 4-stat grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <fg-card>
            <div class="t-caption text-forge-500">Sets</div>
            <div class="t-num text-forge-50 mt-1 tabular-nums text-[28px] font-semibold tracking-tight">
              {{ totalSets() }}
            </div>
          </fg-card>
          <fg-card>
            <div class="t-caption text-forge-500">Reps totales</div>
            <div class="t-num text-forge-50 mt-1 tabular-nums text-[28px] font-semibold tracking-tight">
              {{ totalReps() }}
            </div>
          </fg-card>
          <fg-card>
            <div class="t-caption text-forge-500">Duración</div>
            <div class="t-num text-forge-50 mt-1 tabular-nums font-mono text-[28px] font-semibold tracking-tight">
              {{ duration() ?? '—' }}
            </div>
          </fg-card>
          <fg-card>
            <div class="t-caption text-forge-500">Descanso prom.</div>
            <div class="t-num text-forge-50 mt-1 tabular-nums font-mono text-[28px] font-semibold tracking-tight">—</div>
          </fg-card>
        </div>

        <!-- New PRs -->
        @if (prRows().length > 0) {
          <section>
            <div class="t-micro text-forge-500 px-1">NUEVOS PR</div>
            <fg-card [padding]="0" class="mt-2.5">
              @for (row of prRows(); track row.set.id; let last = $last) {
                <div class="px-3.5 py-3 flex items-center gap-3"
                     [class.border-b]="!last">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style="background: rgba(var(--accent-rgb),0.12); box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb),0.3);">
                    <fg-icon name="flame" [size]="14" style="color: var(--accent-text);"></fg-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="t-body text-forge-100 font-medium">{{ row.exerciseName || row.exerciseId }}</div>
                    <div class="t-body-sm text-forge-500 mt-px tabular-nums">{{ row.detail }}</div>
                  </div>
                  @if (row.delta) {
                    <div class="t-mono text-xs font-bold" style="color: var(--accent-text);">{{ row.delta }}</div>
                  }
                </div>
              }
            </fg-card>
          </section>
        }

        <!-- Per-exercise breakdown -->
        <section>
          <div class="t-micro text-forge-500 px-1">EJERCICIOS</div>
          <fg-card [padding]="0" class="mt-2.5">
            @for (row of exerciseRows(); track row.exerciseId; let last = $last) {
              <div class="px-3.5 py-3 flex items-center justify-between gap-2.5"
                   [class.border-b]="!last">
                <div class="flex-1 min-w-0">
                  <div class="t-body text-forge-100">{{ row.name || row.exerciseId }}</div>
                  <div class="t-body-sm text-forge-500 mt-px tabular-nums">
                    {{ row.sets }} sets · {{ row.reps }} reps
                  </div>
                </div>
                @if (row.hasPR) {
                  <fg-chip size="sm" leadingIcon="flame">PR</fg-chip>
                }
              </div>
            } @empty {
              <p class="px-3.5 py-3 t-body text-forge-500">No se registraron series.</p>
            }
          </fg-card>
        </section>

        <!-- Individual set detail (per-set weight/reps for unit display) -->
        @for (set of workedSets(); track set.id) {
          <div class="hidden">
            @switch (set.type) {
              @case ('weight-reps') {
                <span class="session-summary__set-detail">{{ set.reps.value }} reps × {{ set.weight.value | displayWeight: unit() }}</span>
              }
              @case ('bodyweight-reps') {
                <span class="session-summary__set-detail">{{ set.reps.value }} reps
                  @if (set.extraWeight) {
                    (+ {{ set.extraWeight.value | displayWeight: unit() }})
                  }
                </span>
              }
              @case ('time') {
                <span class="session-summary__set-detail">{{ set.durationSec }}s</span>
              }
              @case ('distance-time') {
                <span class="session-summary__set-detail">{{ set.distanceKm }} km en {{ set.durationSec }}s</span>
              }
            }
          </div>
        }

        <!-- CTA -->
        <button fg-button variant="primary" size="lg" [full]="true" leadingIcon="check" (click)="goHome()">
          Guardar y cerrar
        </button>
      </main>
    </div>
  `,
})
export class SessionSummaryPage implements OnInit {
  private readonly store = inject(TrainingSessionStore);
  private readonly sessionRepo = inject(SessionRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly router = inject(Router);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly prRepo = inject(PersonalRecordRepository);
  private readonly toast = inject(ToastService);

  readonly unit = this.userPrefs.unit;
  readonly session = signal<Session | null>(null);
  readonly workedSets = signal<readonly WorkedSet[]>([]);

  /** Map of exerciseId → name, populated in init() from worked sets context. */
  readonly exerciseNameById = signal<Map<string, string>>(new Map());

  /** Map of exerciseId → previous PersonalRecord (before this session). */
  readonly previousPRsByExerciseId = signal<Map<string, PersonalRecord>>(new Map());

  // ---------------------------------------------------------------------------
  // Volume computeds
  // ---------------------------------------------------------------------------

  readonly volumeKg = computed(() =>
    this.workedSets().reduce((acc, s) => {
      if (s.type === 'weight-reps') return acc + s.weight.value * s.reps.value;
      return acc;
    }, 0)
  );

  readonly hasVolume = computed(() => this.volumeKg() > 0);

  readonly volumeValue = computed(() => {
    const v = Math.round(this.volumeKg());
    // Use Intl.NumberFormat without locale to avoid jsdom issues; tests assert 'toContain' number only
    return new Intl.NumberFormat().format(v);
  });

  // ---------------------------------------------------------------------------
  // Stats computeds
  // ---------------------------------------------------------------------------

  readonly totalSets = computed(() => this.workedSets().length);

  readonly totalPrs = computed(() => this.workedSets().filter(s => s.isPR).length);

  readonly prSets = computed(() => this.workedSets().filter(s => s.isPR));

  readonly totalReps = computed(() =>
    this.workedSets().reduce((acc, s) => {
      if (s.type === 'weight-reps' || s.type === 'bodyweight-reps') return acc + s.reps.value;
      return acc;
    }, 0)
  );

  readonly duration = computed(() => {
    const s = this.session();
    if (!s?.endedAt) return null;
    const totalSec = Math.floor((s.endedAt.getTime() - s.startedAt.getTime()) / 1000);
    return formatHMS(totalSec);
  });

  readonly subtitle = computed(() => {
    const d = this.duration();
    return d ? `Duración ${d}` : this.session()?.date ?? '';
  });

  // ---------------------------------------------------------------------------
  // Per-exercise breakdown
  // ---------------------------------------------------------------------------

  readonly exerciseRows = computed<ExerciseRow[]>(() => {
    const byId = new Map<string, ExerciseRow>();
    for (const s of this.workedSets()) {
      const existing = byId.get(s.exerciseId) ?? {
        exerciseId: s.exerciseId,
        name: this.exerciseNameById().get(s.exerciseId) ?? '',
        sets: 0,
        reps: 0,
        hasPR: false,
      };
      existing.sets += 1;
      if (s.type === 'weight-reps' || s.type === 'bodyweight-reps') existing.reps += s.reps.value;
      if (s.isPR) existing.hasPR = true;
      byId.set(s.exerciseId, existing);
    }
    return Array.from(byId.values());
  });

  // ---------------------------------------------------------------------------
  // PR rows
  // ---------------------------------------------------------------------------

  readonly prRows = computed<PrRow[]>(() => {
    return this.workedSets()
      .filter(s => s.isPR)
      .map(s => {
        const prevPR = this.previousPRsByExerciseId().get(s.exerciseId) ?? null;
        return {
          exerciseId: s.exerciseId,
          exerciseName: this.exerciseNameById().get(s.exerciseId) ?? '',
          set: s,
          delta: this.computeDelta(s, prevPR),
          detail: this.formatSetDetail(s),
        };
      });
  });

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.init();
  }

  private async init(): Promise<void> {
    const activeSession = this.store.activeSession();
    if (activeSession) {
      try {
        // Resolve exercise names in parallel with session/set loading (ADR-40 inline pattern)
        const [completedSession, allExercises] = await Promise.all([
          this.sessionRepo.getById(activeSession.id),
          this.exerciseRepo.getAll(),
        ]);

        this.exerciseNameById.set(new Map(allExercises.map(e => [e.id, e.name])));
        this.session.set(completedSession);

        // Load its sets
        if (completedSession) {
          const sets = await this.sessionRepo.getSetsForSession(completedSession.id);
          this.workedSets.set(sets);

          // Load previous PRs for exercises that have new PRs (N calls, parallelized)
          const prExerciseIds = [...new Set(sets.filter(s => s.isPR).map(s => s.exerciseId))];
          const prResults = await Promise.all(
            prExerciseIds.map(async exId => {
              const allPRs = await this.prRepo.listAll(exId);
              // Second-most-recent = the previous PR before today's session
              const previousPR = allPRs.length >= 2 ? allPRs[1] : null;
              return { exId, previousPR };
            })
          );

          const prevMap = new Map<string, PersonalRecord>();
          for (const { exId, previousPR } of prResults) {
            if (previousPR) prevMap.set(exId, previousPR);
          }
          this.previousPRsByExerciseId.set(prevMap);
        }
      } catch {
        this.toast.error('No se pudo cargar el resumen', 'Intentá de nuevo');
      }
    } else {
      // No session in store — navigate home
      void this.router.navigate(['/training']);
    }
  }

  goHome(): void {
    void this.router.navigate(['/training']);
  }

  private computeDelta(newSet: WorkedSet, prev: PersonalRecord | null): string | null {
    if (!prev) return null;
    switch (newSet.type) {
      case 'weight-reps': {
        const prevW = prev.set.type === 'weight-reps' ? prev.set.weight.value : 0;
        const diff = newSet.weight.value - prevW;
        return diff > 0 ? `+${diff} kg` : null;
      }
      case 'bodyweight-reps': {
        const prevReps = prev.set.type === 'bodyweight-reps' ? prev.set.reps.value : 0;
        const diff = newSet.reps.value - prevReps;
        return diff > 0 ? `+${diff} reps` : null;
      }
      default:
        return null;
    }
  }

  private formatSetDetail(s: WorkedSet): string {
    switch (s.type) {
      case 'weight-reps':
        return `${s.weight.value} kg × ${s.reps.value} reps`;
      case 'bodyweight-reps':
        return `${s.reps.value} reps`;
      case 'time':
        return `${s.durationSec}s`;
      case 'distance-time':
        return `${s.distanceKm} km`;
      default:
        return '—';
    }
  }
}
