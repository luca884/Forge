import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingDay, ExerciseInDay } from '../../domain/training-day.entity';
import { EditTrainingDayUseCase } from '../../domain/use-cases/edit-training-day.use-case';
import { RemoveExerciseFromDayUseCase } from '../../domain/use-cases/remove-exercise-from-day.use-case';
import { TrainingDayRepository } from '../../domain/training-day.repository';

@Component({
  selector: 'fg-training-day-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [EditTrainingDayUseCase, RemoveExerciseFromDayUseCase],
  template: `
    <div class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <button class="text-gray-600" (click)="back()">← Volver</button>
        <h1 class="text-xl font-bold">Editar día</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 mb-6">
        <div>
          <label for="day-name" class="block text-sm font-medium mb-1">Nombre del día</label>
          <input
            id="day-name"
            formControlName="name"
            class="w-full border rounded p-2"
            placeholder="Ej: Día A"
          />
        </div>

        <div>
          <label for="day-label" class="block text-sm font-medium mb-1">Etiqueta (opcional)</label>
          <input
            id="day-label"
            formControlName="label"
            class="w-full border rounded p-2"
            placeholder="Ej: Push, Pull, Legs..."
          />
        </div>

        <button
          type="submit"
          [disabled]="form.invalid"
          class="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          Guardar
        </button>
      </form>

      <div>
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold">Ejercicios</h2>
          <button
            class="text-sm bg-blue-600 text-white px-3 py-1 rounded"
            (click)="addExercise()"
          >
            + Agregar ejercicio
          </button>
        </div>

        @if ((day()?.exercises ?? []).length === 0) {
          <p class="text-gray-500 text-sm">No hay ejercicios en este día.</p>
        }

        <ul class="space-y-2">
          @for (exercise of day()?.exercises ?? []; track exercise.exerciseId) {
            <li class="border rounded p-3 flex items-center justify-between">
              <div>
                <span class="font-medium">Ejercicio {{ exercise.exerciseId }}</span>
                <p class="text-sm text-gray-500">
                  {{ exercise.targetSets.length }} series objetivo
                </p>
              </div>
              <button
                class="text-sm text-red-500"
                (click)="removeExercise(exercise)"
              >
                Quitar
              </button>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class TrainingDayEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly editTrainingDay = inject(EditTrainingDayUseCase);
  private readonly removeExerciseFromDay = inject(RemoveExerciseFromDayUseCase);
  private readonly dayRepo = inject(TrainingDayRepository);

  day = signal<TrainingDay | null>(null);
  routineId = signal<string>('');
  dayId = signal<string>('');

  /* eslint-disable @typescript-eslint/unbound-method */
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    label: [''],
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  ngOnInit(): void {
    const rId = this.route.snapshot.paramMap.get('routineId') ?? '';
    const dId = this.route.snapshot.paramMap.get('dayId') ?? '';
    this.routineId.set(rId);
    this.dayId.set(dId);
    void this.loadDay();
  }

  async loadDay(): Promise<void> {
    const d = await this.dayRepo.getById(this.dayId());
    if (d) {
      this.day.set(d);
      this.form.patchValue({ name: d.name, label: d.label ?? '' });
    }
  }

  async save(): Promise<void> {
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

  async removeExercise(exercise: ExerciseInDay): Promise<void> {
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
