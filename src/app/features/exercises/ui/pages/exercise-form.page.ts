import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercise, MuscleGroup, Equipment } from '../../domain/exercise.entity';
import { ExerciseRepository } from '../../domain/exercise.repository';
import { CreateCustomExerciseUseCase } from '../../domain/use-cases/create-custom-exercise.use-case';
import { EditCustomExerciseUseCase } from '../../domain/use-cases/edit-custom-exercise.use-case';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { TrackingType } from '@core/shared/domain/tracking-type';

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
  imports: [ReactiveFormsModule],
  providers: [CreateCustomExerciseUseCase, EditCustomExerciseUseCase, DeleteCustomExerciseUseCase],
  template: `
    <div class="exercise-form-page">
      <div class="page-header">
        <button type="button" (click)="back()">← Volver</button>
        <h1>{{ isEditMode() ? 'Editar ejercicio' : 'Nuevo ejercicio' }}</h1>
      </div>

      @if (isLoading()) {
        <p>Cargando...</p>
      } @else {
        <form [formGroup]="exerciseForm" (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label for="name">Nombre</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Nombre del ejercicio"
            />
            @if (exerciseForm.get('name')?.invalid && exerciseForm.get('name')?.touched) {
              <span class="error">El nombre es requerido</span>
            }
            @if (nameError()) {
              <span class="error">{{ nameError() }}</span>
            }
          </div>

          <div class="form-field">
            <label for="muscleGroup">Grupo muscular</label>
            <select id="muscleGroup" formControlName="muscleGroup">
              @for (group of muscleGroups; track group) {
                <option [value]="group">{{ group }}</option>
              }
            </select>
          </div>

          <div class="form-field">
            <label for="trackingType">Tipo de seguimiento</label>
            <select id="trackingType" formControlName="trackingType">
              @for (type of trackingTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </div>

          <div class="form-field">
            <label for="equipment">Equipamiento (opcional)</label>
            <select id="equipment" formControlName="equipment">
              <option value="">Sin equipamiento especificado</option>
              @for (eq of equipmentOptions; track eq) {
                <option [value]="eq">{{ eq }}</option>
              }
            </select>
          </div>

          <button type="submit" [disabled]="exerciseForm.invalid || isSaving()">
            {{ isEditMode() ? 'Guardar cambios' : 'Crear ejercicio' }}
          </button>
        </form>

        @if (isEditMode() && loadedExercise()?.isCustom) {
          <div class="delete-section">
            <button
              type="button"
              class="delete-btn"
              [disabled]="isDeleting()"
              (click)="onDelete()"
            >
              Eliminar ejercicio
            </button>
          </div>
        }

        @if (formError()) {
          <p class="form-error">{{ formError() }}</p>
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

  readonly isEditMode = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly loadedExercise = signal<Exercise | null>(null);
  readonly nameError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  readonly exerciseForm = this.fb.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: ['', Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    muscleGroup: ['chest' as MuscleGroup, Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    trackingType: ['weight-reps' as TrackingType, Validators.required],
    equipment: [''],
  });

  ngOnInit(): void {
    void this.loadForm();
  }

  private async loadForm(): Promise<void> {
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

    const { name, muscleGroup, trackingType, equipment } = this.exerciseForm.value;
    if (!name || !muscleGroup || !trackingType) return;

    this.isSaving.set(true);
    this.nameError.set(null);
    this.formError.set(null);

    try {
      if (this.isEditMode()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        await this.editUseCase.execute({
          id,
          name,
          muscleGroup: muscleGroup as MuscleGroup,
          equipment: equipment ? (equipment as Equipment) : undefined,
        });
      } else {
        await this.createUseCase.execute({
          name,
          muscleGroup: muscleGroup as MuscleGroup,
          trackingType: trackingType as TrackingType,
          equipment: equipment ? (equipment as Equipment) : undefined,
        });
      }
      await this.router.navigate(['/exercises']);
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
      this.formError.set(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      this.isDeleting.set(false);
    }
  }

  back(): void {
    void this.router.navigate(['/exercises']);
  }
}
