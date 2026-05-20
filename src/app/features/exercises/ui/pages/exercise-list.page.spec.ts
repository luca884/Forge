import { TestBed } from '@angular/core/testing';
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
