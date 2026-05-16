import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { Exercise, MuscleGroup } from '../../domain/exercise.entity';
import { ExerciseFilter } from '../../domain/exercise-filter';
import { GetExercisesUseCase } from '../../domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '../../domain/use-cases/seed-exercises.use-case';

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
  providers: [
    GetExercisesUseCase,
    SeedExercisesUseCase,
  ],
  template: `
    <div class="exercise-list-page">
      <h1>Ejercicios</h1>

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
    const result = await this.getExercisesUseCase.execute(filter);
    this.exercises.set(result);
  }
}
