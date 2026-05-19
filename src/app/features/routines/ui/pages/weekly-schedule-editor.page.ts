import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingDay } from '../../domain/training-day.entity';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { RoutineRepository } from '../../domain/routine.repository';
import { SetWeeklyScheduleUseCase } from '../../domain/use-cases/set-weekly-schedule.use-case';
import { WeeklySchedule, DAYS_OF_WEEK, DayOfWeek } from '../../domain/value-objects/weekly-schedule';
import {
  FgPageHeaderComponent,
  FgSkeletonComponent,
  FgCardComponent,
  type PageHeaderAction,
} from '@core/shared/ui';

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
  imports: [ReactiveFormsModule, FgPageHeaderComponent, FgSkeletonComponent, FgCardComponent],
  providers: [SetWeeklyScheduleUseCase],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-page-header
      title="Programa semanal"
      leadingIcon="chevron-left"
      [trailingActions]="trailingActions"
      (leadingClick)="cancel()"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6">
      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="44"></fg-skeleton>
        </fg-card>
      } @else {
        <form [formGroup]="form" class="flex flex-col gap-3">
          @for (dow of daysOfWeek; track dow) {
            <div class="flex items-center gap-3">
              <label [for]="'schedule-' + dow" class="t-body-sm text-forge-300 w-28 flex-shrink-0">
                {{ dowLabel(dow) }}
              </label>
              <select
                [id]="'schedule-' + dow"
                [formControlName]="dow"
                class="h-11 flex-1 rounded-md bg-forge-900 px-3 text-forge-50 text-[15px] ring-1 ring-inset ring-forge-800 outline-none focus:ring-accent-500"
              >
                <option [value]="''">— Día de descanso —</option>
                @for (day of trainingDays(); track day.id) {
                  <option [value]="day.id">{{ day.name }}{{ day.label ? ' — ' + day.label : '' }}</option>
                }
              </select>
            </div>
          }

          @if (errorMessage()) {
            <p role="alert" class="t-body-sm text-destructive-500">{{ errorMessage() }}</p>
          }

          @if (successMessage()) {
            <p role="status" class="t-body-sm text-accent-300">{{ successMessage() }}</p>
          }
        </form>
      }
    </div>
  `,
})
export class WeeklyScheduleEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  // Direct repo access — aceptado en proposal slice F §verification
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

  readonly trailingActions: readonly PageHeaderAction[] = [
    { icon: 'check', ariaLabel: 'Guardar programa', click: () => { void this.save(); } },
  ];

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
