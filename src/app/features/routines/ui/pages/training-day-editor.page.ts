import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
  FgPageHeaderComponent,
  FgInputComponent,
  FgCardComponent,
  FgEmptyStateComponent,
  FgButtonComponent,
  FgIconComponent,
  FgSkeletonComponent,
  type PageHeaderAction,
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

@Component({
  selector: 'fg-training-day-editor-page',
  standalone: true,
  styles: [`
    .target-num {
      width: 72px;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: none;
      outline: none;
      text-align: center;
      color: rgb(var(--forge-50));
      font-weight: 600;
      font-size: 22px;
      line-height: 1.2;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }
    .target-num::-webkit-outer-spin-button,
    .target-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `],
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
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
    <fg-page-header
      title="Editar día"
      leadingIcon="chevron-left"
      [trailingActions]="trailingActions"
      (leadingClick)="back()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-6">
      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="44"></fg-skeleton>
        </fg-card>
      } @else {
        <form [formGroup]="form" class="flex flex-col gap-4">
          <fg-input
            label="Nombre del día"
            formControlName="name"
            placeholder="Ej: Día A"
            [error]="submitAttempted() && nameControl.invalid ? 'El nombre es obligatorio' : undefined"
          ></fg-input>
          <fg-input
            label="Etiqueta (opcional)"
            formControlName="label"
            placeholder="Ej: Push, Pull, Legs..."
          ></fg-input>
        </form>

        <section class="flex flex-col gap-3">
          <h2 class="t-h3 text-forge-100">Ejercicios</h2>

          @if ((day()?.exercises ?? []).length === 0) {
            <fg-empty-state
              icon="dumbbell"
              title="Sin ejercicios"
              body="Agregá tu primer ejercicio a este día."
            ></fg-empty-state>
          } @else {
            @for (exercise of day()?.exercises ?? []; track exercise.exerciseId) {
              <fg-card>
                <div class="flex items-center justify-between">
                  <button
                    type="button"
                    (click)="toggleExpand(exercise.exerciseId)"
                    class="text-left flex-1 min-w-0"
                    [attr.aria-label]="'Editar series de ' + exercise.exerciseName"
                  >
                    <span class="t-body text-forge-100">{{ exercise.exerciseName }}</span>
                    <p class="t-body-sm text-forge-400">
                      {{ exercise.targetSets.length }} series objetivo
                    </p>
                  </button>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="toggleExpand(exercise.exerciseId)"
                      [attr.aria-label]="'Editar series de ' + exercise.exerciseName"
                      class="w-9 h-9 inline-flex items-center justify-center rounded-md text-forge-200 hover:bg-forge-850"
                    >
                      <fg-icon name="edit" [size]="18"></fg-icon>
                    </button>
                    <button
                      type="button"
                      (click)="removeExercise(exercise)"
                      [attr.aria-label]="'Quitar ' + exercise.exerciseName"
                      class="w-9 h-9 inline-flex items-center justify-center rounded-md text-destructive-500 hover:bg-forge-850"
                    >
                      <fg-icon name="trash" [size]="18"></fg-icon>
                    </button>
                  </div>
                </div>

                @if (expandedExerciseId() === exercise.exerciseId) {
                  <div class="mt-3 pt-3 border-t border-forge-800 space-y-4">
                    <fg-target-set-editor
                      [trackingType]="exercise.trackingType"
                      [targetSets]="exercise.targetSets"
                      (targetSetsChange)="onTargetSetsChange(exercise, $event)"
                    ></fg-target-set-editor>

                    <div class="flex flex-col items-center gap-1">
                      <span class="t-caption text-forge-500">Descanso</span>
                      <div class="flex items-baseline gap-1 justify-center">
                        <input
                          type="number"
                          inputmode="numeric"
                          min="0"
                          placeholder="90"
                          class="target-num"
                          [value]="exercise.restSeconds ?? ''"
                          (change)="onRestSecondsChange(exercise, $event)"
                        />
                        <span class="t-caption text-forge-600">seg</span>
                      </div>
                    </div>
                  </div>
                }
              </fg-card>
            }
          }

          <button
            fg-button
            variant="ghost"
            [leadingIcon]="'plus'"
            (click)="addExercise()"
            class="self-end"
          >
            Agregar ejercicio
          </button>
        </section>
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

  readonly day = signal<TrainingDayView | null>(null);
  readonly routineId = signal<string>('');
  readonly dayId = signal<string>('');
  readonly submitAttempted = signal(false);
  readonly loading = signal(true);
  readonly expandedExerciseId = signal<string | null>(null);

  readonly trailingActions: readonly PageHeaderAction[] = [
    { icon: 'check', ariaLabel: 'Guardar día', click: () => { void this.save(); } },
  ];

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
