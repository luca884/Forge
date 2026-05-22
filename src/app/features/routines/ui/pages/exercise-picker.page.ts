import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Exercise, MuscleGroup } from '@features/exercises/domain/exercise.entity';
import { ExerciseFilter } from '@features/exercises/domain/exercise-filter';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import {
  FgPageHeaderComponent,
  FgInputComponent,
  FgCardComponent,
  FgChipComponent,
  FgEmptyStateComponent,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { ExerciseThumbnailComponent } from '@features/exercises/ui/components/exercise-thumbnail.component';
import { AddExerciseToDayUseCase } from '../../domain/use-cases/add-exercise-to-day.use-case';

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
  selector: 'fg-exercise-picker-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
    FgInputComponent,
    FgCardComponent,
    FgChipComponent,
    FgEmptyStateComponent,
    ExerciseThumbnailComponent,
  ],
  providers: [GetExercisesUseCase, SeedExercisesUseCase, AddExerciseToDayUseCase],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-page-header
      title="Elegir ejercicio"
      leadingIcon="chevron-left"
      (leadingClick)="back()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-4">
      <fg-input
        label="Buscar"
        placeholder="Buscar ejercicio..."
        [formControl]="searchControl"
      ></fg-input>

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

      @if (exercises().length === 0) {
        <fg-empty-state
          icon="dumbbell"
          title="Sin resultados"
          body="No se encontraron ejercicios."
        ></fg-empty-state>
      } @else {
        <ul class="flex flex-col gap-2" role="list">
          @for (exercise of exercises(); track exercise.id) {
            <li>
              <fg-card>
                <button
                  type="button"
                  (click)="pickExercise(exercise)"
                  class="w-full text-left flex items-center gap-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md"
                  [attr.aria-label]="'Elegir ' + exercise.name"
                >
                  <fg-exercise-thumbnail [name]="exercise.name" />
                  <span class="flex flex-col gap-0.5 min-w-0">
                    <span class="t-body text-forge-100">{{ exercise.name }}</span>
                    <span class="t-body-sm text-forge-400">{{ muscleGroupLabel(exercise.muscleGroup) }}</span>
                  </span>
                </button>
              </fg-card>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ExercisePickerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getExercises = inject(GetExercisesUseCase);
  private readonly seedExercises = inject(SeedExercisesUseCase);
  private readonly addExerciseToDay = inject(AddExerciseToDayUseCase);

  readonly exercises = signal<Exercise[]>([]);
  readonly searchQuery = signal('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly routineId = signal('');
  readonly dayId = signal('');

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly muscleGroupLabel = muscleGroupLabel;

  readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      // Re-run whenever the text query OR the muscle-group filter changes. N-2.
      this.searchQuery();
      this.muscleGroupFilter();
      void this.loadExercises();
    });
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.searchQuery.set(value));
  }

  async ngOnInit(): Promise<void> {
    this.routineId.set(this.route.snapshot.paramMap.get('routineId') ?? '');
    this.dayId.set(this.route.snapshot.paramMap.get('dayId') ?? '');
    // Ensure the built-in catalog exists even if the user never opened the
    // Exercises tab, then reload so the picker isn't empty on a fresh DB. F-1.
    await this.seedExercises.execute();
    await this.loadExercises();
  }

  toggleMuscleGroup(group: MuscleGroup): void {
    this.muscleGroupFilter.set(this.muscleGroupFilter() === group ? undefined : group);
  }

  async loadExercises(): Promise<void> {
    const search = this.searchQuery().trim();
    const muscleGroup = this.muscleGroupFilter();
    const filter: ExerciseFilter | undefined =
      search || muscleGroup ? { search: search || undefined, muscleGroup } : undefined;
    this.exercises.set(await this.getExercises.execute(filter));
  }

  async pickExercise(exercise: Exercise): Promise<void> {
    await this.addExerciseToDay.execute({
      dayId: this.dayId(),
      exerciseId: exercise.id,
    });
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
    ]);
  }

  back(): void {
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
    ]);
  }
}
