import { TestBed } from '@angular/core/testing';
import { ExerciseFormPage } from './exercise-form.page';
import { DeleteCustomExerciseUseCase } from '../../domain/use-cases/delete-custom-exercise.use-case';
import { CreateCustomExerciseUseCase } from '../../domain/use-cases/create-custom-exercise.use-case';
import { EditCustomExerciseUseCase } from '../../domain/use-cases/edit-custom-exercise.use-case';
import { ExerciseRepository } from '../../domain/exercise.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { ExerciseInUseError } from '../../domain/errors/exercise-in-use.error';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Exercise } from '../../domain/exercise.entity';

describe('ExerciseFormPage — onDelete', () => {
  let component: ExerciseFormPage;
  let deleteUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    deleteUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
    const createMock = { execute: jest.fn().mockResolvedValue(undefined) };
    const editMock = { execute: jest.fn().mockResolvedValue(undefined) };
    const exerciseRepoMock = {
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };
    const sessionRepoMock = { existsWorkedSetForExercise: jest.fn().mockResolvedValue(false) };
    const prRepoMock = { existsByExerciseId: jest.fn().mockResolvedValue(false) };
    const trainingDayRepoMock = { existsExerciseInAnyDay: jest.fn().mockResolvedValue(false) };

    const activatedRouteMock = {
      snapshot: {
        paramMap: { get: jest.fn().mockReturnValue('ex-1') },
        queryParamMap: { get: jest.fn().mockReturnValue(null) },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ExerciseFormPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ExerciseRepository, useValue: exerciseRepoMock },
        { provide: SessionRepository, useValue: sessionRepoMock },
        { provide: PersonalRecordRepository, useValue: prRepoMock },
        { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
      ],
    })
    .overrideComponent(ExerciseFormPage, {
      set: {
        providers: [
          { provide: DeleteCustomExerciseUseCase, useValue: deleteUseCase },
          { provide: CreateCustomExerciseUseCase, useValue: createMock },
          { provide: EditCustomExerciseUseCase, useValue: editMock },
        ],
      },
    })
    .compileComponents();

    const fixture = TestBed.createComponent(ExerciseFormPage);
    component = fixture.componentInstance;
  });

  it('should set a friendly formError when use case throws ExerciseInUseError (P3-2)', async () => {
    deleteUseCase.execute.mockRejectedValue(new ExerciseInUseError('ex-1'));

    await component.onDelete();

    expect(component.formError()).toBe('No se puede borrar el ejercicio: está en uso en tu historial o rutinas');
  });

  it('should surface the error message for other errors', async () => {
    deleteUseCase.execute.mockRejectedValue(new Error('Error inesperado'));

    await component.onDelete();

    expect(component.formError()).toBe('Error inesperado');
  });
});

// Helper to build the return-context fixture (create mode, query params present)
async function makeReturnContextFixture(opts: {
  queryParamGetFn?: (key: string) => string | null;
} = {}): Promise<{
  component: ExerciseFormPage;
  navigateSpy: jest.Mock;
  createMock: { execute: jest.Mock };
}> {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const createMock = {
    execute: jest.fn().mockResolvedValue({
      id: 'new-ex-id',
      name: 'Push Up',
      muscleGroup: 'chest',
      trackingType: 'bodyweight-reps',
      weightUnit: 'kg',
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Exercise),
  };
  const editMock = { execute: jest.fn().mockResolvedValue(undefined) };
  const deleteUseCaseMock = { execute: jest.fn().mockResolvedValue(undefined) };

  const exerciseRepoMock = {
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };
  const sessionRepoMock = { existsWorkedSetForExercise: jest.fn().mockResolvedValue(false) };
  const prRepoMock = { existsByExerciseId: jest.fn().mockResolvedValue(false) };
  const trainingDayRepoMock = { existsExerciseInAnyDay: jest.fn().mockResolvedValue(false) };

  const defaultQueryParamGet = (key: string): string | null => {
    if (key === 'returnRoutineId') return 'r-1';
    if (key === 'returnDayId') return 'd-1';
    return null;
  };

  const activatedRouteMock = {
    snapshot: {
      // Create mode: no id in paramMap
      paramMap: { get: jest.fn().mockReturnValue(null) },
      queryParamMap: { get: jest.fn().mockImplementation(opts.queryParamGetFn ?? defaultQueryParamGet) },
    },
  };

  await TestBed.configureTestingModule({
    imports: [ExerciseFormPage],
    providers: [
      provideRouter([]),
      { provide: Router, useValue: { navigate: navigateSpy } },
      { provide: ActivatedRoute, useValue: activatedRouteMock },
      { provide: ExerciseRepository, useValue: exerciseRepoMock },
      { provide: SessionRepository, useValue: sessionRepoMock },
      { provide: PersonalRecordRepository, useValue: prRepoMock },
      { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
    ],
  })
    .overrideComponent(ExerciseFormPage, {
      set: {
        providers: [
          { provide: DeleteCustomExerciseUseCase, useValue: deleteUseCaseMock },
          { provide: CreateCustomExerciseUseCase, useValue: createMock },
          { provide: EditCustomExerciseUseCase, useValue: editMock },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ExerciseFormPage);
  const comp = fixture.componentInstance;
  fixture.detectChanges();
  await fixture.whenStable();

  return { component: comp, navigateSpy, createMock };
}

describe('ExerciseFormPage — return-to-picker context (returnRoutineId + returnDayId query params)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('on create success: navigates to picker with selectedExerciseId when return context present', async () => {
    const { component, navigateSpy } = await makeReturnContextFixture();

    component.exerciseForm.patchValue({ name: 'Push Up', muscleGroup: 'chest', trackingType: 'bodyweight-reps' });
    await component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/routines', 'r-1', 'days', 'd-1', 'pick-exercise'],
      { queryParams: { selectedExerciseId: 'new-ex-id' } },
    );
  });

  it('on create success without return context: navigates to /exercises as before', async () => {
    const { component, navigateSpy } = await makeReturnContextFixture({
      queryParamGetFn: () => null,
    });

    component.exerciseForm.patchValue({ name: 'Push Up', muscleGroup: 'chest', trackingType: 'bodyweight-reps' });
    await component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/exercises']);
  });

  it('back() with return context navigates to picker without selectedExerciseId', async () => {
    const { component, navigateSpy } = await makeReturnContextFixture();

    component.back();

    expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1', 'pick-exercise']);
  });

  it('back() without return context navigates to /exercises', async () => {
    const { component, navigateSpy } = await makeReturnContextFixture({
      queryParamGetFn: () => null,
    });

    component.back();

    expect(navigateSpy).toHaveBeenCalledWith(['/exercises']);
  });
});
