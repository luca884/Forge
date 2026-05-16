import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingDay } from '../../domain/training-day.entity';
import { CreateRoutineUseCase } from '../../domain/use-cases/create-routine.use-case';
import { EditRoutineUseCase } from '../../domain/use-cases/edit-routine.use-case';
import { AddTrainingDayUseCase } from '../../domain/use-cases/add-training-day.use-case';
import { RemoveTrainingDayUseCase } from '../../domain/use-cases/remove-training-day.use-case';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { TrainingDayRepository } from '../../domain/training-day.repository';

@Component({
  selector: 'fg-routine-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    CreateRoutineUseCase,
    EditRoutineUseCase,
    AddTrainingDayUseCase,
    RemoveTrainingDayUseCase,
    GetAllRoutinesUseCase,
  ],
  template: `
    <div class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <button class="text-gray-600" (click)="back()">← Volver</button>
        <h1 class="text-xl font-bold">
          {{ routineId() ? 'Editar rutina' : 'Nueva rutina' }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        <div>
          <label for="routine-name" class="block text-sm font-medium mb-1">Nombre</label>
          <input
            id="routine-name"
            formControlName="name"
            class="w-full border rounded p-2"
            placeholder="Ej: Push Pull Legs"
          />
        </div>

        <div>
          <label for="routine-description" class="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <textarea
            id="routine-description"
            formControlName="description"
            class="w-full border rounded p-2"
            rows="2"
          ></textarea>
        </div>

        <button
          type="submit"
          [disabled]="form.invalid"
          class="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          Guardar
        </button>
      </form>

      @if (routineId()) {
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold">Días de entrenamiento</h2>
            <button
              class="text-sm bg-blue-600 text-white px-3 py-1 rounded"
              (click)="addDay()"
            >
              + Agregar día
            </button>
          </div>

          @if (trainingDays().length === 0) {
            <p class="text-gray-500 text-sm">No hay días de entrenamiento.</p>
          }

          <ul class="space-y-2">
            @for (day of trainingDays(); track day.id) {
              <li class="border rounded p-3 flex items-center justify-between">
                <span>{{ day.name }}</span>
                <div class="flex gap-2">
                  <button
                    class="text-sm text-blue-600"
                    (click)="editDay(day)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-sm text-red-500"
                    (click)="removeDay(day.id)"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class RoutineEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly createRoutine = inject(CreateRoutineUseCase);
  private readonly editRoutine = inject(EditRoutineUseCase);
  private readonly addTrainingDay = inject(AddTrainingDayUseCase);
  private readonly removeTrainingDay = inject(RemoveTrainingDayUseCase);
  private readonly dayRepo = inject(TrainingDayRepository);

  routineId = signal<string | null>(null);
  trainingDays = signal<TrainingDay[]>([]);

  /* eslint-disable @typescript-eslint/unbound-method */
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.routineId.set(id);
      void this.loadDays(id);
    }
  }

  async loadDays(routineId: string): Promise<void> {
    const days = await this.dayRepo.getByRoutineId(routineId);
    this.trainingDays.set(days);
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const { name, description } = this.form.value as { name: string; description: string };
    const id = this.routineId();

    if (id) {
      await this.editRoutine.execute({ id, name, description: description || undefined });
    } else {
      const routine = await this.createRoutine.execute({ name, description: description || undefined });
      this.routineId.set(routine.id);
    }

    void this.router.navigate(['/routines']);
  }

  async addDay(): Promise<void> {
    const id = this.routineId();
    if (!id) return;
    await this.addTrainingDay.execute({ routineId: id, name: `Día ${this.trainingDays().length + 1}` });
    await this.loadDays(id);
  }

  async removeDay(dayId: string): Promise<void> {
    await this.removeTrainingDay.execute(dayId);
    const id = this.routineId();
    if (id) await this.loadDays(id);
  }

  editDay(day: TrainingDay): void {
    const id = this.routineId();
    if (!id) return;
    void this.router.navigate(['/routines', id, 'days', day.id]);
  }

  back(): void {
    void this.router.navigate(['/routines']);
  }
}
