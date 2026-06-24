import { TestBed } from '@angular/core/testing';
import { AddExercisesToDayUseCase } from './add-exercises-to-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { TrainingDay } from '../training-day.entity';

const makeDay = (exerciseIds: string[] = []): TrainingDay => ({
  id: 'd-1',
  routineId: 'r-1',
  name: 'Día A',
  exercises: exerciseIds.map((id, i) => ({ exerciseId: id, order: i, targetSets: [] })),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

describe('AddExercisesToDayUseCase', () => {
  let useCase: AddExercisesToDayUseCase;
  let getById: jest.Mock;
  let save: jest.Mock;
  let exGetById: jest.Mock;

  beforeEach(() => {
    getById = jest.fn();
    save = jest.fn().mockResolvedValue(undefined);
    exGetById = jest.fn().mockImplementation((id: string) => Promise.resolve({ id, name: id, muscleGroup: 'chest', trackingType: 'weight-reps', weightUnit: 'kg', isCustom: false, createdAt: new Date(), updatedAt: new Date() }));

    TestBed.configureTestingModule({
      providers: [
        AddExercisesToDayUseCase,
        { provide: TrainingDayRepository, useValue: { getById, save, getByRoutineId: jest.fn(), delete: jest.fn(), existsExerciseInAnyDay: jest.fn() } },
        { provide: ExerciseRepository, useValue: { getById: exGetById, getAll: jest.fn(), save: jest.fn(), count: jest.fn(), delete: jest.fn() } },
      ],
    });
    useCase = TestBed.inject(AddExercisesToDayUseCase);
  });

  it('agrega varios ejercicios con orders consecutivos en un solo save', async () => {
    getById.mockResolvedValue(makeDay(['a'])); // day already has 1 exercise (order 0)

    await useCase.execute({ dayId: 'd-1', exerciseIds: ['b', 'c'] });

    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as TrainingDay;
    expect(saved.exercises.map((e) => [e.exerciseId, e.order])).toEqual([
      ['a', 0], ['b', 1], ['c', 2],
    ]);
  });

  it('omite ejercicios que ya están en el día (dedup)', async () => {
    getById.mockResolvedValue(makeDay(['a']));

    await useCase.execute({ dayId: 'd-1', exerciseIds: ['a', 'b'] });

    const saved = save.mock.calls[0][0] as TrainingDay;
    expect(saved.exercises.map((e) => e.exerciseId)).toEqual(['a', 'b']);
  });

  it('no guarda si no hay ejercicios nuevos para agregar', async () => {
    getById.mockResolvedValue(makeDay(['a']));

    await useCase.execute({ dayId: 'd-1', exerciseIds: ['a'] });

    expect(save).not.toHaveBeenCalled();
  });

  it('lanza ExerciseNotFoundError si un ejercicio no existe', async () => {
    getById.mockResolvedValue(makeDay([]));
    exGetById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ dayId: 'd-1', exerciseIds: ['x'] })).rejects.toBeInstanceOf(ExerciseNotFoundError);
  });

  it('lanza error cuando el día no existe (dayId inexistente)', async () => {
    getById.mockResolvedValue(null);

    await expect(
      useCase.execute({ dayId: 'no-existe', exerciseIds: ['a'] }),
    ).rejects.toThrow('TrainingDay not found');
  });
});
