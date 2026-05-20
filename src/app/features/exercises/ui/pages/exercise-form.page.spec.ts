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
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

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
      snapshot: { paramMap: { get: jest.fn().mockReturnValue('ex-1') } },
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
