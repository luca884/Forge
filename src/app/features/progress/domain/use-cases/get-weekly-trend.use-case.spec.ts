import { TestBed } from '@angular/core/testing';
import { GetWeeklyTrendUseCase } from './get-weekly-trend.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import type { Exercise } from '@features/exercises/domain/exercise.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

describe('GetWeeklyTrendUseCase', () => {
  const getWorkedSetsSince = jest.fn<Promise<WorkedSet[]>, [Date]>().mockResolvedValue([]);
  const getAll = jest.fn<Promise<Exercise[]>, []>().mockResolvedValue([]);

  beforeEach(() => {
    getWorkedSetsSince.mockReset().mockResolvedValue([]);
    getAll.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        GetWeeklyTrendUseCase,
        { provide: SessionRepository, useValue: { getWorkedSetsSince } },
        { provide: ExerciseRepository, useValue: { getAll } },
      ],
    });
  });

  it('returns one zero-filled point per requested week for an empty history', async () => {
    const result = await TestBed.inject(GetWeeklyTrendUseCase).execute({ weeksBack: 3 });

    expect(result).toHaveLength(3);
    expect(result.every(point => point.volumeKg === 0 && point.sessions === 0)).toBe(true);
  });

  it('queries from the start of the earliest requested week', async () => {
    await TestBed.inject(GetWeeklyTrendUseCase).execute({ weeksBack: 12 });

    expect(getWorkedSetsSince).toHaveBeenCalledTimes(1);
    const fromDate = getWorkedSetsSince.mock.calls[0]![0];
    const expected = new Date();
    const day = expected.getDay();
    expected.setDate(expected.getDate() - ((day + 6) % 7) - 77);
    expected.setHours(0, 0, 0, 0);
    expect(Math.abs(fromDate.getTime() - expected.getTime())).toBeLessThan(2_000);
  });

  // S11: a plates set weighs plates × the plate weight of its exercise, not the plate count in kg.
  it('weighs a plates set with the plate weight of its exercise', async () => {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(10, 0, 0, 0);
    getWorkedSetsSince.mockResolvedValue([{
      id: 'ws-1', sessionId: 's1', exerciseId: 'press', type: 'weight-reps',
      weight: new Weight(4), reps: new Reps(10), isPR: false, createdAt: monday,
    }]);
    getAll.mockResolvedValue([{
      id: 'press', name: 'Prensa', muscleGroup: 'legs', trackingType: 'weight-reps',
      weightUnit: 'plates', plateWeightKg: 10, isCustom: true, createdAt: new Date(), updatedAt: new Date(),
    }]);

    const result = await TestBed.inject(GetWeeklyTrendUseCase).execute({ weeksBack: 1 });

    expect(result[0]!.volumeKg).toBe(4 * 10 * 10);
  });
});
