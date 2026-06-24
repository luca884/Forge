import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercise, MuscleGroup, Equipment } from '../../domain/exercise.entity';
import { ExerciseRepository } from '../../domain/exercise.repository';
import { CreateCustomExerciseUseCase } from '../../domain/use-cases/create-custom-exercise.use-case';
import { EditCustomExerciseUseCase } from '../../domain/use-cases/edit-custom-exercise.use-case';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit, WEIGHT_UNIT_OPTIONS } from '@core/shared/domain/weight-unit';
import {
  FgPageHeaderComponent,
  FgInputComponent,
  FgButtonComponent,
  FgCardComponent,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { trackingTypeLabel, equipmentLabel } from '../helpers/exercise-labels';

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

const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
];

const TRACKING_TYPES: TrackingType[] = ['weight-reps', 'bodyweight-reps', 'time', 'distance-time'];

@Component({
  selector: 'fg-exercise-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
    FgInputComponent,
    FgButtonComponent,
    FgCardComponent,
  ],
  providers: [CreateCustomExerciseUseCase, EditCustomExerciseUseCase, DeleteCustomExerciseUseCase],
  template: `
    <fg-page-header
      [title]="isEditMode() ? 'Editar ejercicio' : 'Nuevo ejercicio'"
      leadingIcon="chevron-left"
      (leadingClick)="back()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-4">
      @if (isLoading()) {
        <p class="t-body text-forge-400">Cargando...</p>
      } @else {
        <fg-card>
          <form [formGroup]="exerciseForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <fg-input
                label="Nombre"
                placeholder="Nombre del ejercicio"
                formControlName="name"
              ></fg-input>
              @if (exerciseForm.get('name')?.invalid && exerciseForm.get('name')?.touched) {
                <span class="t-caption text-destructive">El nombre es requerido</span>
              }
              @if (nameError()) {
                <span class="t-caption text-destructive">{{ nameError() }}</span>
              }
            </div>

            <label class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Grupo muscular</span>
              <select
                formControlName="muscleGroup"
                class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                @for (group of muscleGroups; track group) {
                  <option [value]="group">{{ muscleGroupLabel(group) }}</option>
                }
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Tipo de seguimiento</span>
              <select
                formControlName="trackingType"
                class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                @for (type of trackingTypes; track type) {
                  <option [value]="type">{{ trackingTypeLabel(type) }}</option>
                }
              </select>
            </label>

            @if (exerciseForm.get('trackingType')?.value === 'weight-reps') {
              <label class="flex flex-col gap-1.5">
                <span class="t-caption text-forge-300">Unidad de peso</span>
                <select
                  formControlName="weightUnit"
                  class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  @for (opt of weightUnitOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
            }

            <label class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Equipamiento (opcional)</span>
              <select
                formControlName="equipment"
                class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <option value="">Sin equipamiento especificado</option>
                @for (eq of equipmentOptions; track eq) {
                  <option [value]="eq">{{ equipmentLabel(eq) }}</option>
                }
              </select>
            </label>

            <button
              type="submit"
              fg-button
              variant="primary"
              size="lg"
              class="w-full"
              [disabled]="exerciseForm.invalid || isSaving()"
            >
              {{ isEditMode() ? 'Guardar cambios' : 'Crear ejercicio' }}
            </button>
          </form>
        </fg-card>

        @if (isEditMode() && loadedExercise()?.isCustom) {
          <button
            type="button"
            fg-button
            variant="destructive"
            size="lg"
            class="w-full"
            [disabled]="isDeleting()"
            (click)="onDelete()"
          >
            Eliminar ejercicio
          </button>
        }

        @if (formError()) {
          <p class="t-body-sm text-destructive" role="alert">{{ formError() }}</p>
        }
      }
    </div>
  `,
})
export class ExerciseFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly createUseCase = inject(CreateCustomExerciseUseCase);
  private readonly editUseCase = inject(EditCustomExerciseUseCase);
  private readonly deleteUseCase = inject(DeleteCustomExerciseUseCase);
  private readonly fb = inject(FormBuilder);

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly equipmentOptions = EQUIPMENT_OPTIONS;
  readonly trackingTypes = TRACKING_TYPES;

  readonly muscleGroupLabel = muscleGroupLabel;
  readonly trackingTypeLabel = trackingTypeLabel;
  readonly equipmentLabel = equipmentLabel;

  readonly isEditMode = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly loadedExercise = signal<Exercise | null>(null);
  readonly nameError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly returnRoutineId = signal<string | null>(null);
  readonly returnDayId = signal<string | null>(null);

  readonly weightUnitOptions = WEIGHT_UNIT_OPTIONS;

  readonly exerciseForm = this.fb.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: ['', Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    muscleGroup: ['chest' as MuscleGroup, Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    trackingType: ['weight-reps' as TrackingType, Validators.required],
    equipment: [''],
    weightUnit: ['kg' as WeightUnit],
  });

  ngOnInit(): void {
    void this.loadForm();
  }

  private async loadForm(): Promise<void> {
    this.returnRoutineId.set(this.route.snapshot.queryParamMap.get('returnRoutineId'));
    this.returnDayId.set(this.route.snapshot.queryParamMap.get('returnDayId'));

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      try {
        const exercise = await this.exerciseRepo.getById(id);
        if (exercise) {
          this.loadedExercise.set(exercise);
          this.exerciseForm.patchValue({
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            trackingType: exercise.trackingType,
            equipment: exercise.equipment ?? '',
            weightUnit: exercise.weightUnit ?? 'kg',
          });
        }
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.isLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.exerciseForm.invalid) return;

    const { name, muscleGroup, trackingType, equipment, weightUnit } = this.exerciseForm.value;
    if (!name || !muscleGroup || !trackingType) return;

    this.isSaving.set(true);
    this.nameError.set(null);
    this.formError.set(null);

    try {
      if (this.isEditMode()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        // weightUnit only applies when trackingType is weight-reps;
        // for other types it's ignored but harmlessly passed through.
        const resolvedWeightUnit: WeightUnit =
          trackingType === 'weight-reps' ? ((weightUnit as WeightUnit) ?? 'kg') : 'kg';
        await this.editUseCase.execute({
          id,
          name,
          muscleGroup: muscleGroup as MuscleGroup,
          equipment: equipment ? (equipment as Equipment) : undefined,
          weightUnit: resolvedWeightUnit,
        });
        await this.router.navigate(['/exercises']);
      } else {
        const resolvedWeightUnitCreate: WeightUnit =
          trackingType === 'weight-reps' ? ((weightUnit as WeightUnit) ?? 'kg') : 'kg';
        const created = await this.createUseCase.execute({
          name,
          muscleGroup: muscleGroup as MuscleGroup,
          trackingType: trackingType as TrackingType,
          equipment: equipment ? (equipment as Equipment) : undefined,
          weightUnit: resolvedWeightUnitCreate,
        });
        const returnRoutineId = this.returnRoutineId();
        const returnDayId = this.returnDayId();
        if (returnRoutineId && returnDayId) {
          await this.router.navigate(
            ['/routines', returnRoutineId, 'days', returnDayId, 'pick-exercise'],
            { queryParams: { selectedExerciseId: created.id } },
          );
        } else {
          await this.router.navigate(['/exercises']);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('name')) {
        this.nameError.set(message);
      } else {
        this.formError.set(message);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDelete(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isDeleting.set(true);
    this.formError.set(null);

    try {
      await this.deleteUseCase.execute({ id });
      await this.router.navigate(['/exercises']);
    } catch (err) {
      if (err instanceof ExerciseInUseError) {
        this.formError.set('No se puede borrar el ejercicio: está en uso en tu historial o rutinas');
      } else {
        this.formError.set(err instanceof Error ? err.message : 'Error al eliminar');
      }
    } finally {
      this.isDeleting.set(false);
    }
  }

  back(): void {
    const returnRoutineId = this.returnRoutineId();
    const returnDayId = this.returnDayId();
    if (returnRoutineId && returnDayId) {
      void this.router.navigate(['/routines', returnRoutineId, 'days', returnDayId, 'pick-exercise']);
    } else {
      void this.router.navigate(['/exercises']);
    }
  }
}
