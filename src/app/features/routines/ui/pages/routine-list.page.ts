import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Routine } from '../../domain/routine.entity';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { GetRoutineDaysCountUseCase } from '../../domain/use-cases/get-routine-days-count.use-case';
import { RoutineCardComponent } from '../components/routine-card.component';
import {
  FgPageHeaderComponent,
  FgCardComponent,
  FgSkeletonComponent,
  FgEmptyStateComponent,
  type PageHeaderAction,
} from '@core/shared/ui';

@Component({
  selector: 'fg-routine-list-page',
  standalone: true,
  imports: [
    FgPageHeaderComponent,
    FgCardComponent,
    FgSkeletonComponent,
    FgEmptyStateComponent,
    RoutineCardComponent,
  ],
  providers: [
    GetAllRoutinesUseCase,
    GetRoutineDaysCountUseCase,
    // SetActiveRoutineUseCase REMOVIDO — funcionalidad migra a slice F
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-page-header
      title="Rutinas"
      [trailingActions]="trailingActions"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-3">
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
        @for (routine of routines(); track routine.id) {
          <fg-routine-card
            [routine]="routine"
            [dayCount]="dayCountFor(routine.id)"
            (cardClick)="openRoutine($event)"
          ></fg-routine-card>
        }
      }
    </div>
  `,
})
export class RoutineListPage implements OnInit {
  private readonly getAllRoutines = inject(GetAllRoutinesUseCase);
  private readonly getDaysCount = inject(GetRoutineDaysCountUseCase);
  private readonly router = inject(Router);

  readonly routines = signal<readonly Routine[]>([]);
  readonly dayCounts = signal<ReadonlyMap<string, number>>(new Map());
  readonly loading = signal(true);

  // Estático en slice E; convertir a computed si surge condicional
  readonly trailingActions: readonly PageHeaderAction[] = [
    {
      icon: 'plus',
      ariaLabel: 'Nueva rutina',
      click: () => this.createRoutine(),
    },
  ];

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

  private async loadRoutines(): Promise<void> {
    const routines = await this.getAllRoutines.execute();
    this.routines.set(routines);
    // N+1 aceptable per slice E proposal §Risks #3
    const entries = await Promise.all(
      routines.map(async (r) => [r.id, await this.getDaysCount.execute(r.id)] as const),
    );
    this.dayCounts.set(new Map(entries));
    this.loading.set(false);
  }
}
