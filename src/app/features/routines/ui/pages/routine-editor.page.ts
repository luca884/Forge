import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TrainingDay } from '../../domain/training-day.entity';
import { CreateRoutineUseCase } from '../../domain/use-cases/create-routine.use-case';
import { EditRoutineUseCase } from '../../domain/use-cases/edit-routine.use-case';
import { AddTrainingDayUseCase } from '../../domain/use-cases/add-training-day.use-case';
import { RemoveTrainingDayUseCase } from '../../domain/use-cases/remove-training-day.use-case';
import { DeleteRoutineUseCase } from '../../domain/use-cases/delete-routine.use-case';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { RoutineRepository } from '../../domain/routine.repository';
import { SetActiveRoutineUseCase } from '../../domain/use-cases/set-active-routine.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';

@Component({
  selector: 'fg-routine-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
    FgInputComponent,
    FgCardComponent,
    FgEmptyStateComponent,
    FgButtonComponent,
    FgIconComponent,
    FgSkeletonComponent,
  ],
  providers: [
    CreateRoutineUseCase,
    EditRoutineUseCase,
    AddTrainingDayUseCase,
    RemoveTrainingDayUseCase,
    DeleteRoutineUseCase,
    SetActiveRoutineUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-page-header
      [title]="title()"
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
            label="Nombre"
            formControlName="name"
            placeholder="Ej: Push Pull Legs"
            [error]="submitAttempted() && nameControl.invalid ? 'El nombre es obligatorio' : undefined"
          ></fg-input>

          <label class="flex flex-col gap-1.5">
            <span class="t-caption text-forge-300">Descripción</span>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Notas opcionales sobre esta rutina"
              class="min-h-[80px] rounded-md bg-forge-900 px-3 py-2 text-forge-50 text-[15px] ring-1 ring-inset ring-forge-800 outline-none focus:ring-accent-500 resize-y"
            ></textarea>
          </label>
        </form>

        @if (routineId()) {
          <div class="flex flex-col gap-1.5 mt-2">
            <button
              fg-button
              [variant]="isActive() ? 'accent_soft' : 'secondary'"
              [leadingIcon]="'check'"
              [disabled]="isActive()"
              [attr.aria-label]="isActive() ? 'Esta rutina ya está activa' : 'Marcar rutina como activa'"
              (click)="markActive()"
              class="self-start"
            >
              {{ isActive() ? 'Rutina activa' : 'Marcar como activa' }}
            </button>
            @if (isActive()) {
              <span class="t-caption text-forge-400">Es la rutina activa: define el día sugerido de hoy.</span>
            }
          </div>

          <section class="mt-2 flex flex-col gap-3">
            <h2 class="t-h3 text-forge-100">Días</h2>

            <button
              fg-button
              variant="ghost"
              [leadingIcon]="'calendar'"
              (click)="goToSchedule()"
              class="self-start"
            >
              Programa semanal
            </button>

            @if (trainingDays().length === 0) {
              <fg-empty-state
                icon="dumbbell"
                title="Sin días aún"
                body="Agregá tu primer día de entrenamiento."
              ></fg-empty-state>
            } @else {
              @for (day of trainingDays(); track day.id) {
                <fg-card>
                  <div class="flex items-center justify-between">
                    <span class="t-body text-forge-100">{{ day.name }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="editDay(day)"
                        [attr.aria-label]="'Editar día ' + day.name"
                        class="w-9 h-9 inline-flex items-center justify-center rounded-md text-forge-200 hover:bg-forge-850"
                      >
                        <fg-icon name="edit" [size]="18"></fg-icon>
                      </button>
                      <button
                        type="button"
                        (click)="removeDay(day.id)"
                        [attr.aria-label]="'Eliminar día ' + day.name"
                        class="w-9 h-9 inline-flex items-center justify-center rounded-md text-destructive-500 hover:bg-forge-850"
                      >
                        <fg-icon name="trash" [size]="18"></fg-icon>
                      </button>
                    </div>
                  </div>
                </fg-card>
              }
            }

            <button
              fg-button
              variant="ghost"
              [leadingIcon]="'plus'"
              (click)="addDay()"
              class="self-end"
            >
              Agregar día
            </button>
          </section>

          <section class="mt-4 pt-4 border-t border-forge-800">
            @if (!confirmingDelete()) {
              <button
                type="button"
                fg-button
                variant="destructive"
                [leadingIcon]="'trash'"
                (click)="confirmingDelete.set(true)"
                class="w-full"
              >
                Eliminar rutina
              </button>
            } @else {
              <div class="flex flex-col gap-2">
                <span class="t-body-sm text-forge-300">¿Eliminar esta rutina y sus días? No se puede deshacer.</span>
                <div class="flex gap-2">
                  <button
                    type="button"
                    fg-button
                    variant="destructive"
                    class="flex-1"
                    [disabled]="deleting()"
                    (click)="deleteRoutine()"
                  >Eliminar</button>
                  <button
                    type="button"
                    fg-button
                    variant="ghost"
                    class="flex-1"
                    [disabled]="deleting()"
                    (click)="confirmingDelete.set(false)"
                  >Cancelar</button>
                </div>
              </div>
            }
          </section>
        }
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
  private readonly deleteRoutineUseCase = inject(DeleteRoutineUseCase);
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly routineRepo = inject(RoutineRepository);
  private readonly setActiveRoutine = inject(SetActiveRoutineUseCase);
  private readonly toast = inject(ToastService);

  readonly routineId = signal<string | null>(null);
  readonly trainingDays = signal<TrainingDay[]>([]);
  readonly submitAttempted = signal(false);
  readonly loading = signal(false);
  readonly isActive = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);

  readonly title = computed(() =>
    this.routineId() ? 'Editar rutina' : 'Nueva rutina',
  );

  readonly trailingActions: readonly PageHeaderAction[] = [
    { icon: 'check', ariaLabel: 'Guardar rutina', click: () => { void this.save(); } },
  ];

  /* eslint-disable @typescript-eslint/unbound-method */
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  get nameControl(): FormControl<string> {
    return this.form.controls['name'] as FormControl<string>;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.routineId.set(id);
      this.loading.set(true);
      void this.loadEditData(id);
    }
  }

  private async loadEditData(id: string): Promise<void> {
    try {
      const [routine, days] = await Promise.all([
        this.routineRepo.getById(id),
        this.dayRepo.getByRoutineId(id),
      ]);
      if (routine) {
        this.form.patchValue({ name: routine.name, description: routine.description ?? '' });
        this.isActive.set(routine.isActive);
      }
      this.trainingDays.set(days);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRoutine(id: string): Promise<void> {
    const routine = await this.routineRepo.getById(id);
    if (routine) {
      this.form.patchValue({ name: routine.name, description: routine.description ?? '' });
    }
  }

  async loadDays(routineId: string): Promise<void> {
    const days = await this.dayRepo.getByRoutineId(routineId);
    this.trainingDays.set(days);
  }

  async save(): Promise<void> {
    this.submitAttempted.set(true);
    if (this.form.invalid) return;

    const { name, description } = this.form.value as { name: string; description: string };
    const id = this.routineId();

    if (id) {
      await this.editRoutine.execute({ id, name, description: description || undefined });
    } else {
      await this.createRoutine.execute({ name, description: description || undefined });
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

  goToSchedule(): void {
    const id = this.routineId();
    if (!id) return;
    void this.router.navigate(['/routines', id, 'schedule']);
  }

  async markActive(): Promise<void> {
    const id = this.routineId();
    if (!id || this.isActive()) return;
    await this.setActiveRoutine.execute(id);
    this.isActive.set(true);
    this.toast.success('Rutina marcada como activa');
  }

  async deleteRoutine(): Promise<void> {
    const id = this.routineId();
    if (!id) return;
    this.deleting.set(true);
    try {
      await this.deleteRoutineUseCase.execute(id);
      this.toast.success('Rutina eliminada');
      void this.router.navigate(['/routines']);
    } catch {
      this.toast.error('No se pudo eliminar la rutina', 'Intentá de nuevo');
      this.deleting.set(false);
      this.confirmingDelete.set(false);
    }
  }

  back(): void {
    void this.router.navigate(['/routines']);
  }
}
