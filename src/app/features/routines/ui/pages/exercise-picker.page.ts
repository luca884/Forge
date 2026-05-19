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
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';
import {
  FgPageHeaderComponent,
  FgInputComponent,
  FgCardComponent,
  FgEmptyStateComponent,
} from '@core/shared/ui';
import { AddExerciseToDayUseCase } from '../../domain/use-cases/add-exercise-to-day.use-case';

@Component({
  selector: 'fg-exercise-picker-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
    FgInputComponent,
    FgCardComponent,
    FgEmptyStateComponent,
  ],
  providers: [GetExercisesUseCase, AddExerciseToDayUseCase],
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
                  class="w-full text-left flex flex-col gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md"
                  [attr.aria-label]="'Elegir ' + exercise.name"
                >
                  <span class="t-body text-forge-100">{{ exercise.name }}</span>
                  <span class="t-body-sm text-forge-400">{{ exercise.muscleGroup }}</span>
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
  private readonly addExerciseToDay = inject(AddExerciseToDayUseCase);

  readonly exercises = signal<Exercise[]>([]);
  readonly searchQuery = signal('');
  readonly routineId = signal('');
  readonly dayId = signal('');

  readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      const query = this.searchQuery();
      void this.loadExercises(query);
    });
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.searchQuery.set(value));
  }

  ngOnInit(): void {
    this.routineId.set(this.route.snapshot.paramMap.get('routineId') ?? '');
    this.dayId.set(this.route.snapshot.paramMap.get('dayId') ?? '');
  }

  async loadExercises(search: string): Promise<void> {
    const filter = search.trim() ? { search: search.trim() } : undefined;
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
