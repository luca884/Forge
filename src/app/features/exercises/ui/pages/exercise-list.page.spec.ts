import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ExerciseListPage } from './exercise-list.page';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { GetExercisesUseCase } from '../../domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '../../domain/use-cases/seed-exercises.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { Exercise } from '../../domain/exercise.entity';
import { ExerciseRepository } from '../../domain/exercise.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { provideRouter } from '@angular/router';
import { FgEmptyStateComponent, FgSkeletonComponent } from '@core/shared/ui';
import { FgChipComponent } from '@core/shared/ui';

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Shared factory for TestBed setup
function buildModuleWithMocks(overrides: {
  getExecute?: jest.Mock;
  seedExecute?: jest.Mock;
  deleteExecute?: jest.Mock;
  toastError?: jest.Mock;
}): {
  getUseCaseMock: { execute: jest.Mock };
  seedUseCaseMock: { execute: jest.Mock };
  deleteUseCaseMock: { execute: jest.Mock };
  toastMock: { error: jest.Mock; success: jest.Mock };
} {
  const getUseCaseMock = { execute: overrides.getExecute ?? jest.fn().mockResolvedValue([]) };
  const seedUseCaseMock = { execute: overrides.seedExecute ?? jest.fn().mockResolvedValue(undefined) };
  const deleteUseCaseMock = { execute: overrides.deleteExecute ?? jest.fn().mockResolvedValue(undefined) };
  const toastMock = {
    error: overrides.toastError ?? jest.fn().mockReturnValue(1),
    success: jest.fn().mockReturnValue(1),
  };
  return { getUseCaseMock, seedUseCaseMock, deleteUseCaseMock, toastMock };
}

async function setupTestBed(mocks: {
  getUseCaseMock: { execute: jest.Mock };
  seedUseCaseMock: { execute: jest.Mock };
  deleteUseCaseMock: { execute: jest.Mock };
  toastMock: { error: jest.Mock; success: jest.Mock };
}): Promise<void> {
  const exerciseRepoMock = {
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };
  const sessionRepoMock = { existsWorkedSetForExercise: jest.fn().mockResolvedValue(false) };
  const prRepoMock = { existsByExerciseId: jest.fn().mockResolvedValue(false) };
  const trainingDayRepoMock = { existsExerciseInAnyDay: jest.fn().mockResolvedValue(false) };

  await TestBed.configureTestingModule({
    imports: [ExerciseListPage],
    providers: [
      provideRouter([]),
      { provide: ExerciseRepository, useValue: exerciseRepoMock },
      { provide: SessionRepository, useValue: sessionRepoMock },
      { provide: PersonalRecordRepository, useValue: prRepoMock },
      { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
      { provide: ToastService, useValue: mocks.toastMock },
    ],
  })
    .overrideComponent(ExerciseListPage, {
      set: {
        providers: [
          { provide: DeleteCustomExerciseUseCase, useValue: mocks.deleteUseCaseMock },
          { provide: GetExercisesUseCase, useValue: mocks.getUseCaseMock },
          { provide: SeedExercisesUseCase, useValue: mocks.seedUseCaseMock },
        ],
      },
    })
    .compileComponents();
}

describe('ExerciseListPage — deleteExercise', () => {
  let component: ExerciseListPage;
  let deleteUseCase: { execute: jest.Mock };
  let toastService: { error: jest.Mock; success: jest.Mock };

  beforeEach(async () => {
    deleteUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
    const getUseCaseMock = { execute: jest.fn().mockResolvedValue([]) };
    const seedUseCaseMock = { execute: jest.fn().mockResolvedValue(undefined) };
    toastService = { error: jest.fn().mockReturnValue(1), success: jest.fn().mockReturnValue(1) };

    const exerciseRepoMock = {
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };
    const sessionRepoMock = { existsWorkedSetForExercise: jest.fn().mockResolvedValue(false) };
    const prRepoMock = { existsByExerciseId: jest.fn().mockResolvedValue(false) };
    const trainingDayRepoMock = { existsExerciseInAnyDay: jest.fn().mockResolvedValue(false) };

    await TestBed.configureTestingModule({
      imports: [ExerciseListPage],
      providers: [
        provideRouter([]),
        { provide: ExerciseRepository, useValue: exerciseRepoMock },
        { provide: SessionRepository, useValue: sessionRepoMock },
        { provide: PersonalRecordRepository, useValue: prRepoMock },
        { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
        { provide: ToastService, useValue: toastService },
      ],
    })
      .overrideComponent(ExerciseListPage, {
        set: {
          providers: [
            { provide: DeleteCustomExerciseUseCase, useValue: deleteUseCase },
            { provide: GetExercisesUseCase, useValue: getUseCaseMock },
            { provide: SeedExercisesUseCase, useValue: seedUseCaseMock },
          ],
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ExerciseListPage);
    component = fixture.componentInstance;
  });

  it('should show an ExerciseInUseError toast when use case throws ExerciseInUseError (P3-2)', async () => {
    deleteUseCase.execute.mockRejectedValue(new ExerciseInUseError('ex-1'));

    await component.deleteExercise(makeExercise());

    expect(toastService.error).toHaveBeenCalledWith(
      'No se puede borrar el ejercicio',
      'Está en uso en tu historial o rutinas',
    );
  });

  it('should show a generic error toast when use case throws an unknown error (P3-2)', async () => {
    deleteUseCase.execute.mockRejectedValue(new Error('unexpected'));

    await component.deleteExercise(makeExercise());

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo borrar el ejercicio',
      'Intentá de nuevo',
    );
  });

  it('should NOT show any toast on successful deletion (P3-2)', async () => {
    deleteUseCase.execute.mockResolvedValue(undefined);

    await component.deleteExercise(makeExercise());

    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should skip non-custom exercises without calling the use case', async () => {
    await component.deleteExercise(makeExercise({ isCustom: false }));

    expect(deleteUseCase.execute).not.toHaveBeenCalled();
    expect(toastService.error).not.toHaveBeenCalled();
  });
});

describe('ExerciseListPage — loadExercises error (P3-3)', () => {
  it('calls toast.error when loadExercises rejects (P3-3)', async () => {
    const getUseCaseMock = { execute: jest.fn().mockRejectedValue(new Error('db error')) };
    const seedUseCaseMock = { execute: jest.fn().mockResolvedValue(undefined) };
    const deleteUseCaseMock = { execute: jest.fn().mockResolvedValue(undefined) };
    const toastMock = { error: jest.fn().mockReturnValue(1), success: jest.fn().mockReturnValue(1) };

    const exerciseRepoMock = {
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };
    const sessionRepoMock = { existsWorkedSetForExercise: jest.fn().mockResolvedValue(false) };
    const prRepoMock = { existsByExerciseId: jest.fn().mockResolvedValue(false) };
    const trainingDayRepoMock = { existsExerciseInAnyDay: jest.fn().mockResolvedValue(false) };

    await TestBed.configureTestingModule({
      imports: [ExerciseListPage],
      providers: [
        provideRouter([]),
        { provide: ExerciseRepository, useValue: exerciseRepoMock },
        { provide: SessionRepository, useValue: sessionRepoMock },
        { provide: PersonalRecordRepository, useValue: prRepoMock },
        { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
        { provide: ToastService, useValue: toastMock },
      ],
    })
      .overrideComponent(ExerciseListPage, {
        set: {
          providers: [
            { provide: DeleteCustomExerciseUseCase, useValue: deleteUseCaseMock },
            { provide: GetExercisesUseCase, useValue: getUseCaseMock },
            { provide: SeedExercisesUseCase, useValue: seedUseCaseMock },
          ],
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    // Flush the effect() and the async load
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();

    expect(toastMock.error).toHaveBeenCalledWith(
      'No se pudieron cargar los ejercicios',
      'Intentá de nuevo',
    );
  });
});

// P3-4: DS migration — behavioral tests for new template elements

describe('ExerciseListPage — search signal (P3-4)', () => {
  let component: ExerciseListPage;

  beforeEach(async () => {
    const mocks = buildModuleWithMocks({});
    await setupTestBed(mocks);
    const fixture = TestBed.createComponent(ExerciseListPage);
    component = fixture.componentInstance;
  });

  it('searchQuery signal starts empty', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('searchQuery.set updates the signal value used by the filter', () => {
    component.searchQuery.set('press');
    expect(component.searchQuery()).toBe('press');
  });

  it('searchQuery.set to empty string clears the filter', () => {
    component.searchQuery.set('squat');
    component.searchQuery.set('');
    expect(component.searchQuery()).toBe('');
  });
});

describe('ExerciseListPage — muscle-group chip filter (P3-4)', () => {
  let component: ExerciseListPage;

  beforeEach(async () => {
    const mocks = buildModuleWithMocks({});
    await setupTestBed(mocks);
    const fixture = TestBed.createComponent(ExerciseListPage);
    component = fixture.componentInstance;
  });

  it('muscleGroupFilter starts as undefined ("Todos" active)', () => {
    expect(component.muscleGroupFilter()).toBeUndefined();
  });

  it('toggleMuscleGroup sets the filter to the given group', () => {
    component.toggleMuscleGroup('chest');
    expect(component.muscleGroupFilter()).toBe('chest');
  });

  it('toggleMuscleGroup with an already-active group resets filter to undefined', () => {
    component.toggleMuscleGroup('chest');
    component.toggleMuscleGroup('chest');
    expect(component.muscleGroupFilter()).toBeUndefined();
  });

  it('toggleMuscleGroup switches from one group to another', () => {
    component.toggleMuscleGroup('back');
    component.toggleMuscleGroup('legs');
    expect(component.muscleGroupFilter()).toBe('legs');
  });
});

describe('ExerciseListPage — empty state rendering (P3-4)', () => {
  let fixture: ComponentFixture<ExerciseListPage>;

  it('renders fg-empty-state when exercises list is empty', async () => {
    const mocks = buildModuleWithMocks({
      getExecute: jest.fn().mockResolvedValue([]),
    });
    await setupTestBed(mocks);

    fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.directive(FgEmptyStateComponent));
    expect(emptyState).not.toBeNull();
  });

  it('does NOT render fg-empty-state when exercises list has items', async () => {
    const mocks = buildModuleWithMocks({
      getExecute: jest.fn().mockResolvedValue([
        makeExercise({ id: 'ex-1', name: 'Bench Press' }),
        makeExercise({ id: 'ex-2', name: 'Squat', muscleGroup: 'legs' }),
      ]),
    });
    await setupTestBed(mocks);

    fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.directive(FgEmptyStateComponent));
    expect(emptyState).toBeNull();
  });
});

describe('ExerciseListPage — muscle-group chips rendered (P3-4)', () => {
  let fixture: ComponentFixture<ExerciseListPage>;
  let component: ExerciseListPage;

  beforeEach(async () => {
    const mocks = buildModuleWithMocks({});
    await setupTestBed(mocks);
    fixture = TestBed.createComponent(ExerciseListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders at least 10 fg-chip elements (Todos + 9 muscle groups)', () => {
    const chips = fixture.debugElement.queryAll(By.directive(FgChipComponent));
    expect(chips.length).toBeGreaterThanOrEqual(10);
  });

  it('"Todos" chip is active when muscleGroupFilter is undefined', () => {
    const chips = fixture.debugElement.queryAll(By.directive(FgChipComponent));
    const todosChip = chips[0];
    expect((todosChip.componentInstance as FgChipComponent).active()).toBe(true);
  });

  it('the selected muscle-group chip becomes active after toggleMuscleGroup', () => {
    component.toggleMuscleGroup('back');
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.directive(FgChipComponent));
    // chips[0] = Todos, chips[1..N] = muscle groups in order
    // 'back' is index 1 in MUSCLE_GROUPS array (chest=0, back=1)
    const backChip = chips[2]; // index 0=Todos, 1=chest, 2=back
    expect((backChip.componentInstance as FgChipComponent).active()).toBe(true);
  });
});

// F-2: seed race — first visit must reload after seeding so the catalog appears
describe('ExerciseListPage — seed then reload (F-2 race fix)', () => {
  it('awaits the seed and reloads so the seeded catalog shows on first visit', async () => {
    // First load (constructor effect) sees an empty DB; after the seed runs,
    // the reload must surface the freshly seeded catalog.
    const getExecute = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue([makeExercise({ id: 'seed-1', name: 'Press de banca', isCustom: false })]);
    const seedExecute = jest.fn().mockResolvedValue(undefined);

    const mocks = buildModuleWithMocks({ getExecute, seedExecute });
    await setupTestBed(mocks);

    const fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(seedExecute).toHaveBeenCalled();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Press de banca');
  });
});

// P3-5: loading skeleton
describe('ExerciseListPage — loading skeleton (P3-5)', () => {
  it('shows fg-skeleton while loading is true and hides exercise list', async () => {
    // getExercises hangs (never resolves during this test) so loading stays true
    let resolveLoad!: (v: Exercise[]) => void;
    const pendingLoad = new Promise<Exercise[]>((res) => { resolveLoad = res; });

    const mocks = buildModuleWithMocks({
      getExecute: jest.fn().mockReturnValue(pendingLoad),
    });
    await setupTestBed(mocks);

    const fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    // Do NOT flush — loading should still be true

    const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
    expect(skeleton).not.toBeNull();

    // The exercise-list cards should NOT be rendered yet
    const emptyState = fixture.debugElement.query(By.directive(FgEmptyStateComponent));
    expect(emptyState).toBeNull();

    resolveLoad([]); // clean up
  });

  it('hides fg-skeleton and shows content after load resolves', async () => {
    const mocks = buildModuleWithMocks({
      getExecute: jest.fn().mockResolvedValue([makeExercise({ id: 'ex-1', name: 'Bench Press' })]),
    });
    await setupTestBed(mocks);

    const fixture = TestBed.createComponent(ExerciseListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
    expect(skeleton).toBeNull();

    // Real content (card with exercise name) should be present
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Bench Press');
  });
});
