import { TestBed } from '@angular/core/testing';
import { GetWeeklyTrendUseCase } from './get-weekly-trend.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import type { WorkedSet } from '@features/training/domain/worked-set';

describe('GetWeeklyTrendUseCase', () => {
  const getWorkedSetsSince = jest.fn<Promise<WorkedSet[]>, [Date]>().mockResolvedValue([]);

  beforeEach(() => {
    getWorkedSetsSince.mockClear();
    TestBed.configureTestingModule({
      providers: [
        GetWeeklyTrendUseCase,
        { provide: SessionRepository, useValue: { getWorkedSetsSince } },
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
});
