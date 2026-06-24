import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
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
  FgButtonComponent,
  FgIconComponent,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { ExerciseThumbnailComponent } from '@features/exercises/ui/components/exercise-thumbnail.component';
import { AddExercisesToDayUseCase } from '../../domain/use-cases/add-exercises-to-day.use-case';

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
    FgButtonComponent,
    FgIconComponent,
    ExerciseThumbnailComponent,
  ],
  providers: [GetExercisesUseCase, SeedExercisesUseCase, AddExercisesToDayUseCase],
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

      <button
        fg-button
        variant="secondary"
        size="md"
        class="w-full"
        type="button"
        (click)="createExercise()"
      >
        <fg-icon name="plus" [size]="18"></fg-icon>
        Crear ejercicio nuevo
      </button>

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
              <fg-card [class]="isSelected(exercise.id) ? 'ring-1 ring-inset ring-accent-500' : ''">
                <button
                  type="button"
                  (click)="toggleSelect(exercise.id)"
                  class="w-full text-left flex items-center gap-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md"
                  [attr.aria-pressed]="isSelected(exercise.id)"
                  [attr.aria-label]="(isSelected(exercise.id) ? 'Quitar ' : 'Seleccionar ') + exercise.name"
                >
                  <fg-exercise-thumbnail [name]="exercise.name" />
                  <span class="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span class="t-body text-forge-100">{{ exercise.name }}</span>
                    <span class="t-body-sm text-forge-400">{{ muscleGroupLabel(exercise.muscleGroup) }}</span>
                  </span>
                  @if (isSelected(exercise.id)) {
                    <fg-icon name="check-circle" [size]="20" class="text-accent-400 shrink-0"></fg-icon>
                  }
                </button>
              </fg-card>
            </li>
          }
        </ul>
      }

      @if (selectedCount() > 0) {
        <button
          fg-button
          variant="primary"
          size="lg"
          class="w-full sticky bottom-3"
          (click)="addSelected()"
        >
          Agregar {{ selectedCount() }} {{ selectedCount() === 1 ? 'ejercicio' : 'ejercicios' }}
        </button>
      }
    </div>
  `,
})
export class ExercisePickerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getExercises = inject(GetExercisesUseCase);
  private readonly seedExercises = inject(SeedExercisesUseCase);
  private readonly addExercises = inject(AddExercisesToDayUseCase);

  readonly exercises = signal<Exercise[]>([]);
  readonly searchQuery = signal('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedIds().size);
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

    // Pre-select exercise returned from create-exercise flow (query param).
    const selectedExerciseId = this.route.snapshot.queryParamMap.get('selectedExerciseId');
    if (selectedExerciseId) {
      // Reload so any newly created exercise appears in the list.
      await this.loadExercises();
      const next = new Set(this.selectedIds());
      next.add(selectedExerciseId);
      this.selectedIds.set(next);
    }
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

  isSelected(exerciseId: string): boolean {
    return this.selectedIds().has(exerciseId);
  }

  toggleSelect(exerciseId: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(exerciseId)) {
      next.delete(exerciseId);
    } else {
      next.add(exerciseId);
    }
    this.selectedIds.set(next);
  }

  async addSelected(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    await this.addExercises.execute({ dayId: this.dayId(), exerciseIds: ids });
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
    ]);
  }

  createExercise(): void {
    void this.router.navigate(
      ['/exercises/new'],
      { queryParams: { returnRoutineId: this.routineId(), returnDayId: this.dayId() } },
    );
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
