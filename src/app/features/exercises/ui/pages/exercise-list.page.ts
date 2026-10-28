import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Exercise, MuscleGroup } from '../../domain/exercise.entity';
import { ExerciseFilter } from '../../domain/exercise-filter';
import { GetExercisesUseCase } from '../../domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '../../domain/use-cases/seed-exercises.use-case';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import {
  FgEmptyStateComponent,
  FgIconComponent,
  FgButtonComponent,
  FgPageHeaderComponent,
  FgCardComponent,
  FgSkeletonComponent,
  type PageHeaderAction,
} from '@core/shared/ui';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
import { ExerciseThumbnailComponent } from '../components/exercise-thumbnail.component';
import { MuscleGroupFilterComponent } from '../components/muscle-group-filter.component';
import { exerciseMeta } from '../helpers/exercise-labels';

@Component({
  selector: 'fg-exercise-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FgEmptyStateComponent,
    FgButtonComponent,
    FgIconComponent,
    FgPageHeaderComponent,
    FgCardComponent,
    FgSkeletonComponent,
    ExerciseThumbnailComponent,
    MuscleGroupFilterComponent,
  ],
  providers: [
    GetExercisesUseCase,
    SeedExercisesUseCase,
    DeleteCustomExerciseUseCase,
  ],
  template: `
    <fg-page-header
      title="Ejercicios"
      [trailingActions]="trailingActions"
    ></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-3">
      <label
        class="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-line bg-surface text-ink-2 focus-within:border-accent"
      >
        <fg-icon name="search" [size]="18"></fg-icon>
        <span class="sr-only">Buscar ejercicio</span>
        <input
          type="search"
          placeholder="Buscar ejercicios..."
          [value]="searchQuery()"
          (input)="onSearch($event)"
          class="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-ink placeholder:text-ink-2"
        />
      </label>

      <fg-muscle-group-filter
        [selected]="muscleGroupFilter()"
        (pick)="onPickGroup($event)"
      ></fg-muscle-group-filter>

      @if (loading()) {
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
        <fg-card>
          <fg-skeleton [height]="72"></fg-skeleton>
        </fg-card>
      } @else if (exercises().length === 0) {
        <fg-empty-state
          title="No hay ejercicios"
          body="Agregá tu primer ejercicio personalizado"
        >
          <button fgEmptyAction fg-button variant="primary" size="sm" routerLink="/exercises/new">
            Crear ejercicio
          </button>
        </fg-empty-state>
      } @else {
        <h2
          data-group-title
          class="mt-1 text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2"
        >{{ groupTitle() }}</h2>
        <ul class="list-none m-0 p-0 bg-surface border border-line rounded-xl overflow-hidden" role="list">
          @for (exercise of exercises(); track exercise.id) {
            <li class="border-b border-line-soft last:border-b-0">
              <a
                data-exercise-row
                [routerLink]="['/exercises', exercise.id, 'edit']"
                class="flex items-center gap-3.5 min-h-[60px] px-3.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <fg-exercise-thumbnail [name]="exercise.name" />
                <span class="flex flex-col min-w-0 flex-1">
                  <span class="text-[15px] leading-5 font-medium text-ink truncate">{{ exercise.name }}</span>
                  <span class="font-mono text-[11px] leading-4 text-ink-2 truncate">{{ meta(exercise) }}</span>
                </span>
                @if (exercise.isCustom) {
                  <span class="shrink-0 text-[11px] font-semibold text-accent-ink border border-accent rounded px-1.5 py-0.5">Propio</span>
                }
                <span class="shrink-0 text-[13px] font-medium text-accent-ink">Editar</span>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ExerciseListPage implements OnInit {
  private readonly getExercisesUseCase = inject(GetExercisesUseCase);
  private readonly seedExercisesUseCase = inject(SeedExercisesUseCase);
  private readonly deleteUseCase = inject(DeleteCustomExerciseUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly muscleGroupLabel = muscleGroupLabel;
  readonly meta = exerciseMeta;
  readonly loading = signal(true);
  readonly searchQuery = signal<string>('');
  readonly muscleGroupFilter = signal<MuscleGroup | undefined>(undefined);
  readonly exercises = signal<Exercise[]>([]);
  readonly groupTitle = computed(() => {
    const group = this.muscleGroupFilter();
    return `${group ? muscleGroupLabel(group) : 'Todos'} · ${this.exercises().length}`;
  });

  readonly trailingActions: readonly PageHeaderAction[] = [
    {
      icon: 'plus',
      ariaLabel: 'Nuevo ejercicio',
      click: () => void this.router.navigate(['/exercises/new']),
    },
  ];

  constructor() {
    effect(() => {
      const search = this.searchQuery();
      const muscleGroup = this.muscleGroupFilter();
      void this.loadExercises({ search: search || undefined, muscleGroup });
    });
  }

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    // Seed the built-in catalog BEFORE reloading. The constructor effect runs its
    // first load against a possibly-empty DB; awaiting the seed here and reloading
    // guarantees the catalog appears on the first visit (no manual reload). F-2.
    await this.seedExercisesUseCase.execute();
    await this.loadExercises({
      search: this.searchQuery() || undefined,
      muscleGroup: this.muscleGroupFilter(),
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onPickGroup(group: MuscleGroup | undefined): void {
    if (group === undefined) {
      this.muscleGroupFilter.set(undefined);
    } else {
      this.toggleMuscleGroup(group);
    }
  }

  toggleMuscleGroup(group: MuscleGroup): void {
    this.muscleGroupFilter.set(
      this.muscleGroupFilter() === group ? undefined : group,
    );
  }

  private async loadExercises(filter: ExerciseFilter): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.getExercisesUseCase.execute(filter);
      this.exercises.set(result);
    } catch {
      this.toast.error('No se pudieron cargar los ejercicios', 'Intentá de nuevo');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteExercise(exercise: Exercise): Promise<void> {
    if (!exercise.isCustom) return;
    try {
      await this.deleteUseCase.execute({ id: exercise.id });
      await this.loadExercises({
        search: this.searchQuery() || undefined,
        muscleGroup: this.muscleGroupFilter(),
      });
    } catch (err) {
      if (err instanceof ExerciseInUseError) {
        this.toast.error('No se puede borrar el ejercicio', 'Está en uso en tu historial o rutinas');
      } else {
        this.toast.error('No se pudo borrar el ejercicio', 'Intentá de nuevo');
      }
    }
  }
}
