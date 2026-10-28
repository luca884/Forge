import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Routine } from '../../domain/routine.entity';
import { TrainingDay } from '../../domain/training-day.entity';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { GetRoutineDaysCountUseCase } from '../../domain/use-cases/get-routine-days-count.use-case';
import { SetActiveRoutineUseCase } from '../../domain/use-cases/set-active-routine.use-case';
import { RoutineCardComponent } from '../components/routine-card.component';
import {
  FgCardComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  FgIconComponent,
} from '@core/shared/ui';

@Component({
  selector: 'fg-routine-list-page',
  standalone: true,
  imports: [
    FgCardComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
    FgIconComponent,
    RoutineCardComponent,
  ],
  providers: [
    GetAllRoutinesUseCase,
    GetRoutineDaysCountUseCase,
    SetActiveRoutineUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-page text-ink flex flex-col gap-[14px] px-4 pt-5 pb-4">
      <header class="flex items-end justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          @if (!loading()) {
            <span data-routine-count class="text-[13px] leading-[18px] font-medium text-ink-2">{{ countLabel() }}</span>
          }
          <h1 class="text-[32px] leading-9 font-bold tracking-[-0.03em] text-ink">Rutinas</h1>
        </div>
        <button
          type="button"
          aria-label="Nueva rutina"
          class="w-11 h-11 shrink-0 rounded-[10px] border border-line bg-surface text-ink flex items-center justify-center"
          (click)="createRoutine()"
        >
          <fg-icon name="plus" [size]="20"></fg-icon>
        </button>
      </header>

      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
      } @else if (routines().length === 0) {
        <fg-empty-state
          icon="dumbbell"
          title="Aún no tenés rutinas"
          body="Creá tu primera rutina para empezar a entrenar."
        ></fg-empty-state>
      } @else {
        @if (activeRoutine(); as active) {
          <fg-routine-card
            [routine]="active"
            [dayCount]="dayCountFor(active.id)"
            [days]="activeDays()"
            (cardClick)="openRoutine($event)"
            (editWeek)="editWeek($event)"
            (dayClick)="openDay(active, $event)"
          ></fg-routine-card>
        }

        @if (otherRoutines().length > 0) {
          <section class="flex flex-col gap-1.5" aria-labelledby="other-routines-title">
            <h2
              id="other-routines-title"
              class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2"
            >{{ activeRoutine() ? 'Otras rutinas' : 'Rutinas' }}</h2>
            <ul data-other-routines class="list-none m-0 p-0 bg-surface border border-line rounded-lg">
              @for (routine of otherRoutines(); track routine.id) {
                <li class="border-b border-line-soft last:border-b-0">
                  <fg-routine-card
                    [routine]="routine"
                    [dayCount]="dayCountFor(routine.id)"
                    (cardClick)="openRoutine($event)"
                    (activate)="activateRoutine($event)"
                  ></fg-routine-card>
                </li>
              }
            </ul>
          </section>
        }

        <button
          type="button"
          class="flex items-center gap-3 min-h-[60px] pl-3.5 pr-3 bg-surface border border-line rounded-lg text-left text-ink"
          (click)="openLibrary()"
        >
          <span class="w-9 h-9 rounded-lg bg-accent-soft text-accent-ink flex items-center justify-center">
            <fg-icon name="dumbbell" [size]="20"></fg-icon>
          </span>
          <span class="flex-1 text-[15px] font-semibold">Biblioteca de ejercicios</span>
          <fg-icon name="chevron-right" [size]="16" class="text-ink-2"></fg-icon>
        </button>
      }
    </section>
  `,
})
export class RoutineListPage implements OnInit {
  private readonly getAllRoutines = inject(GetAllRoutinesUseCase);
  private readonly getDaysCount = inject(GetRoutineDaysCountUseCase);
  private readonly setActiveRoutine = inject(SetActiveRoutineUseCase);
  // Lectura directa del repo, igual que routine-editor: la tarjeta activa necesita los días completos.
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly router = inject(Router);

  readonly routines = signal<readonly Routine[]>([]);
  readonly dayCounts = signal<ReadonlyMap<string, number>>(new Map());
  readonly activeDays = signal<readonly TrainingDay[]>([]);
  readonly loading = signal(true);

  protected readonly activeRoutine = computed(() => this.routines().find((r) => r.isActive) ?? null);
  protected readonly otherRoutines = computed(() => this.routines().filter((r) => !r.isActive));
  protected readonly countLabel = computed(() => {
    const n = this.routines().length;
    return n === 1 ? '1 rutina' : `${n} rutinas`;
  });

  ngOnInit(): void {
    void this.loadRoutines();
  }

  protected dayCountFor(id: string): number {
    return this.dayCounts().get(id) ?? 0;
  }

  protected createRoutine(): void {
    void this.router.navigate(['/routines/new']);
  }

  openRoutine(routine: Routine): void {
    void this.router.navigate(['/routines', routine.id]);
  }

  protected editWeek(routine: Routine): void {
    void this.router.navigate(['/routines', routine.id, 'schedule']);
  }

  protected openDay(routine: Routine, day: TrainingDay): void {
    void this.router.navigate(['/routines', routine.id, 'days', day.id]);
  }

  protected openLibrary(): void {
    void this.router.navigate(['/exercises']);
  }

  protected async activateRoutine(routine: Routine): Promise<void> {
    await this.setActiveRoutine.execute(routine.id);
    await this.loadRoutines();
  }

  private async loadRoutines(): Promise<void> {
    const routines = await this.getAllRoutines.execute();
    this.routines.set(routines);
    // N+1 aceptable per slice E proposal §Risks #3
    const entries = await Promise.all(
      routines.map(async (r) => [r.id, await this.getDaysCount.execute(r.id)] as const),
    );
    this.dayCounts.set(new Map(entries));
    const active = routines.find((r) => r.isActive);
    this.activeDays.set(active ? await this.dayRepo.getByRoutineId(active.id) : []);
    this.loading.set(false);
  }
}
