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
  FgEmptyStateComponent,
  FgIconComponent,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { exerciseMeta } from '@features/exercises/ui/helpers/exercise-labels';
import { MuscleGroupFilterComponent } from '@features/exercises/ui/components/muscle-group-filter.component';
import { AddExercisesToDayUseCase } from '../../domain/use-cases/add-exercises-to-day.use-case';
import { GetTrainingDayWithExercisesUseCase } from '../../domain/use-cases/get-training-day-with-exercises.use-case';
import { RoutineRepository } from '../../domain/routine.repository';

/**
 * Biblioteca del Cuaderno (C-Library): elegir ejercicios para un día.
 * Búsqueda, filtro por grupo, selección múltiple con contador en el botón de
 * confirmación y la etiqueta "En el día" en lo que el día ya tiene. Los que ya
 * están en el día no se eligen: AddExercisesToDayUseCase ya los descartaba.
 */
@Component({
  selector: 'fg-exercise-picker-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgEmptyStateComponent,
    FgIconComponent,
    MuscleGroupFilterComponent,
  ],
  providers: [
    GetExercisesUseCase,
    SeedExercisesUseCase,
    AddExercisesToDayUseCase,
    GetTrainingDayWithExercisesUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-page text-ink flex flex-col min-h-full">
      <header class="flex items-center justify-between gap-2 h-14 px-2 bg-surface border-b border-line">
        <button
          type="button"
          class="h-11 px-2 text-[15px] font-medium text-ink"
          (click)="back()"
        >Cancelar</button>
        <div class="flex flex-col items-center min-w-0">
          <h1 class="text-[15px] leading-5 font-semibold text-ink truncate max-w-full">{{ title() }}</h1>
          @if (routineName(); as name) {
            <span data-picker-routine class="font-mono text-[11px] text-ink-2 truncate max-w-full">{{ name }}</span>
          }
        </div>
        <button
          type="button"
          aria-label="Crear ejercicio propio"
          class="h-11 w-11 flex items-center justify-center text-accent-ink"
          (click)="createExercise()"
        >
          <fg-icon name="plus" [size]="22"></fg-icon>
        </button>
      </header>

      <div class="flex flex-col gap-2.5 px-4 pt-3 pb-2">
        <label
          class="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-line bg-surface text-ink-2 focus-within:border-accent"
        >
          <fg-icon name="search" [size]="18"></fg-icon>
          <span class="sr-only">Buscar ejercicio</span>
          <input
            type="search"
            [formControl]="searchControl"
            [placeholder]="searchPlaceholder()"
            class="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-ink placeholder:text-ink-2"
          />
        </label>

        <fg-muscle-group-filter
          [selected]="muscleGroupFilter()"
          (pick)="onPickGroup($event)"
        ></fg-muscle-group-filter>
      </div>

      <section class="flex flex-col gap-1.5 px-4 pb-28" aria-labelledby="picker-group-title">
        <h2
          id="picker-group-title"
          data-group-title
          class="mt-1 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2"
        >{{ groupTitle() }}</h2>

        @if (exercises().length === 0) {
          <fg-empty-state
            icon="dumbbell"
            title="Sin resultados"
            body="No se encontraron ejercicios."
          ></fg-empty-state>
        } @else {
          <ul class="list-none m-0 p-0 bg-surface border border-line rounded-xl overflow-hidden" role="list">
            @for (exercise of exercises(); track exercise.id) {
              <li class="border-b border-line-soft last:border-b-0">
                <button
                  type="button"
                  data-exercise-row
                  class="w-full text-left flex items-center gap-3 min-h-[52px] px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-default"
                  [disabled]="isInDay(exercise.id)"
                  [attr.aria-pressed]="isChecked(exercise.id)"
                  [attr.aria-label]="rowLabel(exercise)"
                  (click)="toggleSelect(exercise.id)"
                >
                  <span
                    class="shrink-0 h-5 w-5 rounded-[5px] border flex items-center justify-center"
                    [class]="isChecked(exercise.id)
                      ? (isInDay(exercise.id) ? 'bg-empty border-line text-ink-2' : 'bg-accent border-accent text-accent-on')
                      : 'bg-surface border-dash'"
                    aria-hidden="true"
                  >
                    @if (isChecked(exercise.id)) {
                      <fg-icon name="check" [size]="14" [strokeWidth]="2.5"></fg-icon>
                    }
                  </span>
                  <span class="flex flex-col min-w-0 flex-1">
                    <span
                      class="text-[15px] leading-5 font-medium truncate"
                      [class]="isInDay(exercise.id) ? 'text-ink-2' : 'text-ink'"
                    >{{ exercise.name }}</span>
                    <span class="font-mono text-[11px] leading-4 text-ink-2 truncate">{{ meta(exercise) }}</span>
                  </span>
                  @if (isInDay(exercise.id)) {
                    <span class="shrink-0 text-[11px] font-semibold text-ink-2 border border-line rounded px-1.5 py-0.5">En el día</span>
                  }
                  @if (exercise.isCustom) {
                    <span class="shrink-0 text-[11px] font-semibold text-accent-ink border border-accent rounded px-1.5 py-0.5">Propio</span>
                  }
                </button>
              </li>
            }
          </ul>
        }
      </section>

      <div
        class="sticky bottom-0 mt-auto px-4 pt-3 pb-6 bg-surface border-t border-line"
        style="box-shadow: 0 -10px 30px var(--color-shadow)"
      >
        <button
          type="button"
          data-picker-cta
          class="w-full h-12 rounded-[10px] text-[15px] font-semibold"
          [class]="selectedCount() === 0 ? 'bg-line-soft text-ink-2' : 'bg-accent text-accent-on'"
          [disabled]="selectedCount() === 0"
          (click)="addSelected()"
        >{{ ctaLabel() }}</button>
      </div>
    </div>
  `,
})
export class ExercisePickerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getExercises = inject(GetExercisesUseCase);
  private readonly seedExercises = inject(SeedExercisesUseCase);
  private readonly addExercises = inject(AddExercisesToDayUseCase);
  private readonly getDay = inject(GetTrainingDayWithExercisesUseCase);
  private readonly routineRepo = inject(RoutineRepository);

  readonly exercises = signal<Exercise[]>([]);
  readonly searchQuery = signal('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly routineId = signal('');
  readonly dayId = signal('');
  readonly dayName = signal<string | null>(null);
  readonly routineName = signal<string | null>(null);
  /** Ejercicios que el día ya tiene: se muestran "En el día" y no se eligen. */
  readonly inDayIds = signal<ReadonlySet<string>>(new Set());
  /** Tamaño de toda la biblioteca (última carga sin filtros), para el placeholder. */
  readonly totalCount = signal(0);

  readonly title = computed(() => {
    const name = this.dayName();
    return name ? `Agregar a ${name}` : 'Agregar ejercicios';
  });
  readonly searchPlaceholder = computed(() =>
    this.totalCount() > 0 ? `Buscar en ${this.totalCount()} ejercicios` : 'Buscar ejercicio',
  );
  readonly groupTitle = computed(() => {
    const group = this.muscleGroupFilter();
    return `${group ? muscleGroupLabel(group) : 'Todos'} · ${this.exercises().length}`;
  });
  readonly ctaLabel = computed(() => {
    const count = this.selectedCount();
    if (count === 0) return 'Elegí ejercicios';
    return `Agregar ${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`;
  });

  readonly meta = exerciseMeta;

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

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    this.routineId.set(this.route.snapshot.paramMap.get('routineId') ?? '');
    this.dayId.set(this.route.snapshot.paramMap.get('dayId') ?? '');
    await this.loadDayContext();
    // Ensure the built-in catalog exists even if the user never opened the
    // Exercises tab, then reload so the picker isn't empty on a fresh DB. F-1.
    await this.seedExercises.execute();
    await this.loadExercises();

    // Pre-select exercise returned from create-exercise flow (query param).
    const selectedExerciseId = this.route.snapshot.queryParamMap.get('selectedExerciseId');
    if (selectedExerciseId) {
      // Reload so any newly created exercise appears in the list.
      await this.loadExercises();
      this.toggleSelect(selectedExerciseId);
    }
  }

  /** Nombre del día, nombre de la rutina y ejercicios que el día ya tiene. */
  private async loadDayContext(): Promise<void> {
    try {
      const day = await this.getDay.execute({ trainingDayId: this.dayId() });
      this.dayName.set(day?.name ?? null);
      this.inDayIds.set(new Set((day?.exercises ?? []).map(e => e.exerciseId)));
      const routine = await this.routineRepo.getById(this.routineId());
      this.routineName.set(routine?.name ?? null);
    } catch {
      // Sin contexto el picker sigue sirviendo: solo pierde título, subtítulo y "En el día".
    }
  }

  onPickGroup(group: MuscleGroup | undefined): void {
    if (group === undefined) {
      this.muscleGroupFilter.set(undefined);
    } else {
      this.toggleMuscleGroup(group);
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
    const result = await this.getExercises.execute(filter);
    this.exercises.set(result);
    if (!filter) this.totalCount.set(result.length);
  }

  isInDay(exerciseId: string): boolean {
    return this.inDayIds().has(exerciseId);
  }

  isSelected(exerciseId: string): boolean {
    return this.selectedIds().has(exerciseId);
  }

  /** Tildado en pantalla: elegido ahora o ya en el día. */
  isChecked(exerciseId: string): boolean {
    return this.isSelected(exerciseId) || this.isInDay(exerciseId);
  }

  rowLabel(exercise: Exercise): string {
    if (this.isInDay(exercise.id)) return `${exercise.name}, en el día`;
    return (this.isSelected(exercise.id) ? 'Quitar ' : 'Seleccionar ') + exercise.name;
  }

  toggleSelect(exerciseId: string): void {
    if (this.isInDay(exerciseId)) return;
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
