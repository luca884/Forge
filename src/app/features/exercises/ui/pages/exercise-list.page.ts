import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Exercise, MuscleGroup } from '../../domain/exercise.entity';
import { ExerciseFilter } from '../../domain/exercise-filter';
import { GetExercisesUseCase } from '../../domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '../../domain/use-cases/seed-exercises.use-case';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import {
  FgInputComponent,
  FgChipComponent,
  FgEmptyStateComponent,
  FgButtonComponent,
  FgPageHeaderComponent,
  FgCardComponent,
  FgSkeletonComponent,
  type PageHeaderAction,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { ExerciseThumbnailComponent } from '../components/exercise-thumbnail.component';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
  'full-body',
];

@Component({
  selector: 'fg-exercise-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    FgInputComponent,
    FgChipComponent,
    FgEmptyStateComponent,
    FgButtonComponent,
    FgPageHeaderComponent,
    FgCardComponent,
    FgSkeletonComponent,
    ExerciseThumbnailComponent,
  ],
  providers: [
    GetExercisesUseCase,
    SeedExercisesUseCase,
    DeleteCustomExerciseUseCase,
  ],
  template: `
    <fg-page-header
      title="Ejercicios"
      [trailingActions]="trailingActions"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-3">
      <fg-input
        placeholder="Buscar ejercicios..."
        [ngModel]="searchQuery()"
        (ngModelChange)="searchQuery.set($event)"
      />

      <div class="flex gap-2 overflow-x-auto py-1">
        <fg-chip
          [active]="muscleGroupFilter() === undefined"
          (tap)="muscleGroupFilter.set(undefined)"
        >Todos</fg-chip>

        @for (group of muscleGroups; track group) {
          <fg-chip
            [active]="muscleGroupFilter() === group"
            (tap)="toggleMuscleGroup(group)"
          >{{ muscleGroupLabel(group) }}</fg-chip>
        }
      </div>

      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
      } @else if (exercises().length === 0) {
        <fg-empty-state
          title="No hay ejercicios"
          body="Agregá tu primer ejercicio personalizado"
        >
          <button fgEmptyAction fg-button variant="primary" size="sm" routerLink="/exercises/new">
            Crear ejercicio
          </button>
        </fg-empty-state>
      } @else {
        @for (exercise of exercises(); track exercise.id) {
          <fg-card [padding]="14">
            <div class="flex items-center gap-3.5 text-left">
              <fg-exercise-thumbnail [name]="exercise.name" />
              <div class="flex-1 min-w-0">
                <div class="t-body text-forge-100 font-medium truncate">{{ exercise.name }}</div>
                <div class="t-body-sm text-forge-500 mt-0.5">{{ muscleGroupLabel(exercise.muscleGroup) }}</div>
              </div>
              @if (exercise.isCustom) {
                <a
                  [routerLink]="['/exercises', exercise.id, 'edit']"
                  class="t-body-sm text-accent-300 shrink-0"
                >Editar</a>
              }
            </div>
          </fg-card>
        }
      }
    </div>
  `,
})
export class ExerciseListPage implements OnInit {
  private readonly getExercisesUseCase = inject(GetExercisesUseCase);
  private readonly seedExercisesUseCase = inject(SeedExercisesUseCase);
  private readonly deleteUseCase = inject(DeleteCustomExerciseUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly muscleGroupLabel = muscleGroupLabel;
  readonly muscleGroups = MUSCLE_GROUPS;
  readonly loading = signal(true);
  readonly searchQuery = signal<string>('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly exercises = signal<Exercise[]>([]);

  readonly trailingActions: readonly PageHeaderAction[] = [
    {
      icon: 'plus',
      ariaLabel: 'Nuevo ejercicio',
      click: () => void this.router.navigate(['/exercises/new']),
    },
  ];

  constructor() {
    effect(() => {
      const search = this.searchQuery();
      const muscleGroup = this.muscleGroupFilter();
      void this.loadExercises({ search: search || undefined, muscleGroup });
    });
  }

  async ngOnInit(): Promise<void> {
    // Seed the built-in catalog BEFORE reloading. The constructor effect runs its
    // first load against a possibly-empty DB; awaiting the seed here and reloading
    // guarantees the catalog appears on the first visit (no manual reload). F-2.
    await this.seedExercisesUseCase.execute();
    await this.loadExercises({
      search: this.searchQuery() || undefined,
      muscleGroup: this.muscleGroupFilter(),
    });
  }

  toggleMuscleGroup(group: MuscleGroup): void {
    this.muscleGroupFilter.set(
      this.muscleGroupFilter() === group ? undefined : group,
    );
  }

  private async loadExercises(filter: ExerciseFilter): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.getExercisesUseCase.execute(filter);
      this.exercises.set(result);
    } catch {
      this.toast.error('No se pudieron cargar los ejercicios', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteExercise(exercise: Exercise): Promise<void> {
    if (!exercise.isCustom) return;
    try {
      await this.deleteUseCase.execute({ id: exercise.id });
      await this.loadExercises({
        search: this.searchQuery() || undefined,
        muscleGroup: this.muscleGroupFilter(),
      });
    } catch (err) {
      if (err instanceof ExerciseInUseError) {
        this.toast.error('No se puede borrar el ejercicio', 'Está en uso en tu historial o rutinas');
      } else {
        this.toast.error('No se pudo borrar el ejercicio', 'Intentá de nuevo');
      }
    }
  }
}
