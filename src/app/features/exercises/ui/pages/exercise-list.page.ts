import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Exercise, MuscleGroup } from '../../domain/exercise.entity';
import { ExerciseFilter } from '../../domain/exercise-filter';
import { GetExercisesUseCase } from '../../domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '../../domain/use-cases/seed-exercises.use-case';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { ToastService } from '@core/shared/ui/toast/toast.service';

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
  imports: [RouterLink],
  providers: [
    GetExercisesUseCase,
    SeedExercisesUseCase,
    DeleteCustomExerciseUseCase,
  ],
  template: `
    <div class="exercise-list-page">
      <div class="page-header">
        <h1>Ejercicios</h1>
        <a routerLink="/exercises/new" class="btn-new">+ Nuevo ejercicio</a>
      </div>

      <div class="filters">
        <input
          type="text"
          placeholder="Buscar ejercicios..."
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
        />

        <select (change)="onMuscleGroupChange($event)" [value]="muscleGroupFilter() ?? ''">
          <option value="">Todos los grupos musculares</option>
          @for (group of muscleGroups; track group) {
            <option [value]="group">{{ group }}</option>
          }
        </select>
      </div>

      <ul class="exercise-list">
        @for (exercise of exercises(); track exercise.id) {
          <li class="exercise-item">
            <span class="exercise-name">{{ exercise.name }}</span>
            <span class="exercise-muscle">{{ exercise.muscleGroup }}</span>
            @if (exercise.isCustom) {
              <a [routerLink]="['/exercises', exercise.id, 'edit']" class="btn-edit">Editar</a>
            }
          </li>
        } @empty {
          <li class="exercise-empty">No se encontraron ejercicios</li>
        }
      </ul>
    </div>
  `,
})
export class ExerciseListPage implements OnInit {
  private readonly getExercisesUseCase = inject(GetExercisesUseCase);
  private readonly seedExercisesUseCase = inject(SeedExercisesUseCase);
  private readonly deleteUseCase = inject(DeleteCustomExerciseUseCase);
  private readonly toast = inject(ToastService);

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly searchQuery = signal<string>('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly exercises = signal<Exercise[]>([]);

  constructor() {
    effect(() => {
      const search = this.searchQuery();
      const muscleGroup = this.muscleGroupFilter();
      void this.loadExercises({ search: search || undefined, muscleGroup });
    });
  }

  ngOnInit(): void {
    void this.seedExercisesUseCase.execute();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onMuscleGroupChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.muscleGroupFilter.set(
      select.value ? (select.value as MuscleGroup) : undefined,
    );
  }

  private async loadExercises(filter: ExerciseFilter): Promise<void> {
    try {
      const result = await this.getExercisesUseCase.execute(filter);
      this.exercises.set(result);
    } catch {
      this.toast.error('No se pudieron cargar los ejercicios', 'Intentá de nuevo');
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
