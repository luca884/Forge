import { TestBed } from '@angular/core/testing';
import { DeleteRoutineUseCase } from './delete-routine.use-case';
import { RoutineRepository } from '../routine.repository';
import { TrainingDayRepository } from '../training-day.repository';

describe('DeleteRoutineUseCase', () => {
  let useCase: DeleteRoutineUseCase;
  let routineDelete: jest.Mock;
  let dayGetByRoutine: jest.Mock;
  let dayDelete: jest.Mock;

  beforeEach(() => {
    routineDelete = jest.fn().mockResolvedValue(undefined);
    dayGetByRoutine = jest.fn().mockResolvedValue([]);
    dayDelete = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        DeleteRoutineUseCase,
        {
          provide: RoutineRepository,
          useValue: {
            delete: routineDelete,
            getAll: jest.fn(),
            getActive: jest.fn(),
            getById: jest.fn(),
            save: jest.fn(),
            setActive: jest.fn(),
          },
        },
        {
          provide: TrainingDayRepository,
          useValue: {
            getByRoutineId: dayGetByRoutine,
            delete: dayDelete,
            getById: jest.fn(),
            save: jest.fn(),
            existsExerciseInAnyDay: jest.fn(),
          },
        },
      ],
    });

    useCase = TestBed.inject(DeleteRoutineUseCase);
  });

  it('deletes the routine by id', async () => {
    await useCase.execute('r-1');
    expect(routineDelete).toHaveBeenCalledWith('r-1');
  });

  it('cascades: deletes each training day of the routine before the routine', async () => {
    dayGetByRoutine.mockResolvedValue([{ id: 'd-1' }, { id: 'd-2' }]);

    await useCase.execute('r-1');

    expect(dayGetByRoutine).toHaveBeenCalledWith('r-1');
    expect(dayDelete).toHaveBeenCalledWith('d-1');
    expect(dayDelete).toHaveBeenCalledWith('d-2');
    expect(routineDelete).toHaveBeenCalledWith('r-1');
  });
});
