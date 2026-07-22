import { TestBed } from '@angular/core/testing';
import { GetExerciseProgressListUseCase } from './get-exercise-progress-list.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

describe('GetExerciseProgressListUseCase', () => {
  const getWorkedSetsSince = jest.fn<Promise<WorkedSet[]>, [Date]>().mockResolvedValue([]);
  const getAll = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    getWorkedSetsSince.mockReset().mockResolvedValue([]);
    getAll.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        GetExerciseProgressListUseCase,
        { provide: SessionRepository, useValue: { getWorkedSetsSince } },
        { provide: ExerciseRepository, useValue: { getAll } },
      ],
    });
  });

  it('returns no entries when history is empty', async () => {
    await expect(TestBed.inject(GetExerciseProgressListUseCase).execute()).resolves.toEqual([]);
  });

  it('returns an improving entry from two workouts and resolves its exercise name', async () => {
    getWorkedSetsSince.mockResolvedValue([
      {
        id: 'first', sessionId: 's1', exerciseId: 'bench', type: 'weight-reps',
        weight: new Weight(100), reps: new Reps(5), isPR: false, createdAt: new Date('2026-06-01'),
      },
      {
        id: 'latest', sessionId: 's2', exerciseId: 'bench', type: 'weight-reps',
        weight: new Weight(110), reps: new Reps(5), isPR: false, createdAt: new Date('2026-07-01'),
      },
    ]);
    getAll.mockResolvedValue([{
      id: 'bench', name: 'Bench Press', muscleGroup: 'chest', trackingType: 'weight-reps',
      weightUnit: 'kg', isCustom: false, createdAt: new Date(), updatedAt: new Date(),
    }]);

    const result = await TestBed.inject(GetExerciseProgressListUseCase).execute({ weeksBack: 12 });

    expect(result).toEqual([expect.objectContaining({
      exerciseName: 'Bench Press', status: 'improving', unitLabel: 'kg',
    })]);
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it('queries from twelve weeks ago by default', async () => {
    await TestBed.inject(GetExerciseProgressListUseCase).execute();

    const fromDate = getWorkedSetsSince.mock.calls[0]![0];
    const expected = new Date();
    expected.setDate(expected.getDate() - 84);
    expect(Math.abs(fromDate.getTime() - expected.getTime())).toBeLessThan(2_000);
  });
});
