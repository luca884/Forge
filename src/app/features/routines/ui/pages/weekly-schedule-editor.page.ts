import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingDay } from '../../domain/training-day.entity';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { RoutineRepository } from '../../domain/routine.repository';
import { SetWeeklyScheduleUseCase } from '../../domain/use-cases/set-weekly-schedule.use-case';
import { WeeklySchedule, DAYS_OF_WEEK, DayOfWeek } from '../../domain/value-objects/weekly-schedule';

const DOW_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

/**
 * WeeklyScheduleEditorPage — allows setting a WeeklySchedule on a Routine.
 *
 * Route: /routines/:routineId/schedule
 * Reactive Forms (ADR-9): FormGroup with 7 FormControls (one per DayOfWeek).
 * D-32, V-75.
 */
@Component({
  selector: 'fg-weekly-schedule-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [SetWeeklyScheduleUseCase],
  template: `
    <div class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <button type="button" class="text-forge-300" (click)="cancel()">← Volver</button>
        <h1 class="text-xl font-bold">Programa semanal</h1>
      </div>

      @if (loading()) {
        <p class="text-forge-400">Cargando...</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
          @for (dow of daysOfWeek; track dow) {
            <div class="flex items-center gap-3">
              <label [for]="'schedule-' + dow" class="w-28 text-sm font-medium">{{ dowLabel(dow) }}</label>
              <select
                [id]="'schedule-' + dow"
                [formControlName]="dow"
                class="flex-1 border rounded p-2 text-sm"
              >
                <option [value]="''">— Día de descanso —</option>
                @for (day of trainingDays(); track day.id) {
                  <option [value]="day.id">{{ day.name }}{{ day.label ? ' — ' + day.label : '' }}</option>
                }
              </select>
            </div>
          }

          @if (errorMessage()) {
            <p class="text-red-500 text-sm" role="alert">{{ errorMessage() }}</p>
          }

          @if (successMessage()) {
            <p class="text-green-600 text-sm" role="status">{{ successMessage() }}</p>
          }

          <div class="flex gap-3 mt-4">
            <button
              type="submit"
              [disabled]="saving()"
              class="flex-1 bg-accent-500 text-forge-50 py-2 rounded disabled:opacity-50"
            >
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button
              type="button"
              (click)="cancel()"
              class="flex-1 border border-forge-700 text-forge-200 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class WeeklyScheduleEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineRepo = inject(RoutineRepository);
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly setScheduleUseCase = inject(SetWeeklyScheduleUseCase);

  readonly daysOfWeek: readonly DayOfWeek[] = DAYS_OF_WEEK;
  readonly trainingDays = signal<TrainingDay[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    monday: [''],
    tuesday: [''],
    wednesday: [''],
    thursday: [''],
    friday: [''],
    saturday: [''],
    sunday: [''],
  });

  private routineId!: string;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('routineId');
    if (!id) {
      void this.router.navigate(['/routines']);
      return;
    }
    this.routineId = id;
    void this.loadData(id);
  }

  private async loadData(routineId: string): Promise<void> {
    try {
      const [routine, days] = await Promise.all([
        this.routineRepo.getById(routineId),
        this.dayRepo.getByRoutineId(routineId),
      ]);

      this.trainingDays.set(days);

      // Pre-populate form with existing schedule
      if (routine?.schedule) {
        const patch: Record<string, string> = {};
        for (const dow of DAYS_OF_WEEK) {
          patch[dow] = routine.schedule[dow] ?? '';
        }
        this.form.patchValue(patch);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const formValue = this.form.value as Record<DayOfWeek, string>;
      const schedule: WeeklySchedule = {};
      for (const dow of DAYS_OF_WEEK) {
        const val = formValue[dow];
        if (val && val.trim() !== '') {
          (schedule as Record<DayOfWeek, string | undefined>)[dow] = val;
        }
      }

      await this.setScheduleUseCase.execute({ routineId: this.routineId, schedule });
      this.successMessage.set('Programa guardado correctamente.');

      // Navigate back after a brief moment
      setTimeout(() => void this.router.navigate(['/routines', this.routineId]), 1000);
    } catch {
      this.errorMessage.set('No se pudo guardar el programa. Intentá de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/routines', this.routineId]);
  }

  dowLabel(dow: DayOfWeek): string {
    return DOW_LABELS[dow];
  }
}
