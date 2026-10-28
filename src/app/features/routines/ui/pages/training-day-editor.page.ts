import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FgInputComponent,
  FgCardComponent,
  FgEmptyStateComponent,
  FgButtonComponent,
  FgIconComponent,
  FgSkeletonComponent,
} from '@core/shared/ui';
import {
  GetTrainingDayWithExercisesUseCase,
  type TrainingDayView,
  type ExerciseInDayView,
} from '../../domain/use-cases/get-training-day-with-exercises.use-case';
import { EditTrainingDayUseCase } from '../../domain/use-cases/edit-training-day.use-case';
import { RemoveExerciseFromDayUseCase } from '../../domain/use-cases/remove-exercise-from-day.use-case';
import { SetTargetSetsUseCase } from '../../domain/use-cases/set-target-sets.use-case';
import { SetRestSecondsUseCase } from '../../domain/use-cases/set-rest-seconds.use-case';
import { TargetSetEditorComponent } from '../components/target-set-editor.component';
import { TargetSet } from '../../domain/target-set';
import { RoutineRepository } from '../../domain/routine.repository';
import { RestPreferencesService } from '@core/rest-preferences/rest-preferences.service';

/** "1 serie", "3 series". */
function seriesLabel(count: number): string {
  return count === 1 ? '1 serie' : `${count} series`;
}

/**
 * Un valor objetivo sirve para el resumen si es un número finito mayor que cero.
 * Vaciar un campo del editor guarda `undefined` y "Agregar serie" guarda 0.
 */
function isUsable(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** "5" con valores iguales, "6–8" con valores distintos; null si ninguno sirve. */
function formatRange(values: readonly unknown[]): string | null {
  const usable = values.filter(isUsable);
  if (usable.length === 0) return null;
  const min = Math.min(...usable);
  const max = Math.max(...usable);
  return min === max ? `${min}` : `${min}–${max}`;
}

/**
 * "4 × 6–8", "3 × 5", "3 × 30–60 s", "2 × 5 km"; "N series" si ningún valor sirve; "—" sin series.
 * Usa el tipo de la primera serie y el rango de los valores que sirven; la cantidad cuenta todas las series.
 */
function formatTarget(sets: readonly TargetSet[]): string {
  const first = sets[0];
  if (!first) return '—';
  const withRange = (values: readonly unknown[], unit: string): string => {
    const range = formatRange(values);
    return range === null ? seriesLabel(sets.length) : `${sets.length} × ${range}${unit}`;
  };
  switch (first.type) {
    case 'weight-reps':
    case 'bodyweight-reps':
      return withRange(sets.flatMap((s) => (s.type === first.type ? [s.reps] : [])), '');
    case 'time':
      return withRange(sets.flatMap((s) => (s.type === 'time' ? [s.durationSec] : [])), ' s');
    case 'distance-time':
      return withRange(sets.flatMap((s) => (s.type === 'distance-time' ? [s.distanceKm] : [])), ' km');
  }
}

/** 180 -> "3:00", 90 -> "1:30". */
function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = String(seconds % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

@Component({
  selector: 'fg-training-day-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgInputComponent,
    FgCardComponent,
    FgEmptyStateComponent,
    FgButtonComponent,
    FgIconComponent,
    FgSkeletonComponent,
    TargetSetEditorComponent,
  ],
  providers: [
    GetTrainingDayWithExercisesUseCase,
    EditTrainingDayUseCase,
    RemoveExerciseFromDayUseCase,
    SetTargetSetsUseCase,
    SetRestSecondsUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-page text-ink flex flex-col gap-3 px-4 pt-1 pb-4">
      <div class="flex items-center justify-between -mx-2">
        <button
          type="button"
          aria-label="Volver"
          class="h-11 px-2 flex items-center gap-0.5 text-[15px] font-medium text-ink min-w-0"
          (click)="back()"
        >
          <fg-icon name="chevron-left" [size]="20"></fg-icon>
          <span class="truncate">{{ routineName() }}</span>
        </button>
        <button
          type="button"
          class="h-11 px-2.5 text-[15px] font-semibold text-accent-ink"
          (click)="save()"
        >Listo</button>
      </div>

      <h1 class="sr-only">Editar día</h1>

      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="44"></fg-skeleton>
        </fg-card>
      } @else {
        <form [formGroup]="form" class="flex flex-col gap-2">
          <div class="flex flex-col gap-0.5">
            <input
              type="text"
              formControlName="name"
              aria-label="Nombre del día"
              placeholder="Ej: Día A"
              class="w-full bg-transparent border-0 p-0 outline-none text-[30px] leading-9 font-bold tracking-[-0.03em] text-ink placeholder:text-ink-2"
            />
            @if (submitAttempted() && nameControl.invalid) {
              <span data-name-error class="text-[13px] text-danger">El nombre es obligatorio</span>
            }
            <span data-day-meta class="font-mono text-[13px] text-ink-2">{{ meta() }}</span>
          </div>
          <fg-input
            label="Etiqueta (opcional)"
            size="sm"
            formControlName="label"
            placeholder="Ej: Push, Pull, Legs..."
          ></fg-input>
        </form>

        @if ((day()?.exercises ?? []).length === 0) {
          <fg-empty-state
            icon="dumbbell"
            title="Sin ejercicios"
            body="Agregá tu primer ejercicio a este día."
          ></fg-empty-state>
        } @else {
          <fg-card [padding]="0">
            <!-- One grid shared through subgrid, so Objetivo grows to its longest label and stays aligned with its header.
                 A subgrid's padding comes out of its edge tracks: 36px = 24px + pl-3, 50px = 44px + pr-1.5. -->
            <div class="grid grid-cols-[36px_minmax(0,1fr)_minmax(72px,max-content)_50px] gap-x-1.5">
            <div
              class="col-span-4 grid grid-cols-subgrid pt-2.5 pb-1.5 pl-3 pr-1.5 text-[10px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2 border-b border-line"
              aria-hidden="true"
            >
              <span>#</span><span>Ejercicio</span><span>Objetivo</span><span></span>
            </div>
            @for (exercise of day()?.exercises ?? []; track exercise.exerciseId; let i = $index) {
              @let expanded = expandedExerciseId() === exercise.exerciseId;
              <div
                data-exercise-row
                class="col-span-4 grid grid-cols-subgrid border-b border-line-soft last:border-b-0"
                [class.bg-accent-soft]="expanded"
              >
                <button
                  type="button"
                  class="col-span-4 grid grid-cols-subgrid items-center min-h-[48px] pl-3 pr-1.5 text-left"
                  [attr.aria-label]="'Editar series de ' + exercise.exerciseName"
                  [attr.aria-expanded]="expanded"
                  (click)="toggleExpand(exercise.exerciseId)"
                >
                  <span data-cell class="font-mono text-[13px] text-ink-2">{{ rowNumber(i) }}</span>
                  <span data-cell class="flex flex-col min-w-0">
                    <span
                      class="text-[15px] truncate"
                      [class.font-semibold]="expanded"
                      [class.text-accent-ink]="expanded"
                      [class.font-medium]="!expanded"
                    >{{ exercise.exerciseName }}</span>
                    @if (exercise.restSeconds !== undefined) {
                      <span class="font-mono text-[11px] text-ink-2">desc. {{ restLabel(exercise.restSeconds) }}</span>
                    }
                  </span>
                  <span data-cell class="font-mono text-[13px] tabular-nums whitespace-nowrap">{{ targetLabel(exercise) }}</span>
                  <span class="w-11 h-11 flex items-center justify-center" [class.text-ink]="expanded" [class.text-ink-2]="!expanded" [class.rotate-180]="expanded">
                    <fg-icon name="chevron-down" [size]="18"></fg-icon>
                  </span>
                </button>

                @if (expanded) {
                  <div class="col-span-4 flex flex-col gap-3 px-3 pt-1 pb-3">
                    <fg-target-set-editor
                      [trackingType]="exercise.trackingType"
                      [targetSets]="exercise.targetSets"
                      (targetSetsChange)="onTargetSetsChange(exercise, $event)"
                    ></fg-target-set-editor>

                    <div class="flex items-center justify-between gap-2">
                      <label class="flex items-center gap-2">
                        <span class="text-[11px] leading-3 font-semibold tracking-[0.06em] uppercase text-ink-2">Descanso</span>
                        <input
                          type="number"
                          inputmode="numeric"
                          min="0"
                          [placeholder]="restPlaceholder()"
                          aria-label="Descanso en segundos"
                          class="target-num w-16 h-8 rounded-md bg-surface border border-line focus:border-accent outline-none text-center font-mono text-[15px] text-ink tabular-nums"
                          [value]="exercise.restSeconds ?? ''"
                          (change)="onRestSecondsChange(exercise, $event)"
                        />
                        <span class="text-[12px] text-ink-2">seg</span>
                      </label>
                      <button
                        type="button"
                        class="h-9 px-1 text-[13px] font-semibold text-danger"
                        [attr.aria-label]="'Quitar ' + exercise.exerciseName"
                        (click)="removeExercise(exercise)"
                      >Quitar del día</button>
                    </div>
                  </div>
                }
              </div>
            }
            </div>
          </fg-card>
        }

        <button
          fg-button
          variant="secondary"
          [leadingIcon]="'plus'"
          (click)="addExercise()"
          class="w-full !border-dashed !border-dash"
        >
          Agregar ejercicios
        </button>
      }
    </div>
  `,
})
export class TrainingDayEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getDayWithExercises = inject(GetTrainingDayWithExercisesUseCase);
  private readonly editTrainingDay = inject(EditTrainingDayUseCase);
  private readonly removeExerciseFromDay = inject(RemoveExerciseFromDayUseCase);
  private readonly setTargetSets = inject(SetTargetSetsUseCase);
  private readonly setRestSeconds = inject(SetRestSecondsUseCase);
  private readonly routineRepo = inject(RoutineRepository);
  private readonly restPreferences = inject(RestPreferencesService);

  readonly day = signal<TrainingDayView | null>(null);
  readonly routineId = signal<string>('');
  readonly dayId = signal<string>('');
  readonly submitAttempted = signal(false);
  readonly loading = signal(true);
  readonly expandedExerciseId = signal<string | null>(null);

  readonly routineName = signal('Rutina');

  protected readonly meta = computed(() => {
    const exercises = this.day()?.exercises ?? [];
    const sets = exercises.reduce((total, e) => total + e.targetSets.length, 0);
    const exLabel = exercises.length === 1 ? '1 ejercicio' : `${exercises.length} ejercicios`;
    return `${exLabel} · ${seriesLabel(sets)}`;
  });

  /** Segundos que descansa un ejercicio sin descanso propio: el "Descanso por defecto" de Perfil. */
  protected readonly restPlaceholder = computed(() => String(this.restPreferences.defaultSeconds()));

  /* eslint-disable @typescript-eslint/unbound-method */
  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    label: [''],
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected get nameControl(): FormControl<string> {
    return this.form.controls['name'] as FormControl<string>;
  }

  ngOnInit(): void {
    const rId = this.route.snapshot.paramMap.get('routineId') ?? '';
    const dId = this.route.snapshot.paramMap.get('dayId') ?? '';
    this.routineId.set(rId);
    this.dayId.set(dId);
    void this.loadDay();
    void this.loadRoutineName(rId);
  }

  private async loadRoutineName(routineId: string): Promise<void> {
    const routine = await this.routineRepo.getById(routineId);
    if (routine) this.routineName.set(routine.name);
  }

  protected rowNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected targetLabel(exercise: ExerciseInDayView): string {
    return formatTarget(exercise.targetSets);
  }

  protected restLabel(seconds: number): string {
    return formatRest(seconds);
  }

  async loadDay(): Promise<void> {
    try {
      const d = await this.getDayWithExercises.execute({ trainingDayId: this.dayId() });
      if (d) {
        this.day.set(d);
        this.form.patchValue({ name: d.name, label: d.label ?? '' });
      }
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { name, label } = this.form.value as { name: string; label: string };
    await this.editTrainingDay.execute({
      id: this.dayId(),
      name,
      label: label || undefined,
    });
    void this.router.navigate(['/routines', this.routineId()]);
  }

  addExercise(): void {
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
      'pick-exercise',
    ]);
  }

  toggleExpand(exerciseId: string): void {
    this.expandedExerciseId.set(
      this.expandedExerciseId() === exerciseId ? null : exerciseId,
    );
  }

  async onTargetSetsChange(exercise: ExerciseInDayView, targetSets: TargetSet[]): Promise<void> {
    await this.setTargetSets.execute({
      dayId: this.dayId(),
      exerciseId: exercise.exerciseId,
      targetSets,
    });
    await this.loadDay();
  }

  async onRestSecondsChange(exercise: ExerciseInDayView, event: Event): Promise<void> {
    const raw = (event.target as HTMLInputElement).value.trim();
    const restSeconds = raw === '' ? undefined : parseInt(raw, 10);
    if (restSeconds !== undefined && (!Number.isInteger(restSeconds) || restSeconds < 0)) return;
    await this.setRestSeconds.execute({
      dayId: this.dayId(),
      exerciseId: exercise.exerciseId,
      restSeconds,
    });
    await this.loadDay();
  }

  async removeExercise(exercise: ExerciseInDayView): Promise<void> {
    await this.removeExerciseFromDay.execute({
      dayId: this.dayId(),
      exerciseId: exercise.exerciseId,
    });
    await this.loadDay();
  }

  back(): void {
    void this.router.navigate(['/routines', this.routineId()]);
  }
}
