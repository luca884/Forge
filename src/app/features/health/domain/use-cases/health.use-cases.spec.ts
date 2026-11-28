import { TestBed } from '@angular/core/testing';
import type { HealthDay } from '../health-day.entity';
import { InvalidHealthDayInputError } from '../health-day.entity';
import { HealthDayRepository } from '../health-day.repository';
import { GetHealthDayUseCase } from './get-health-day.use-case';
import { GetHealthTrendUseCase } from './get-health-trend.use-case';
import { SaveHealthDaysUseCase } from './save-health-days.use-case';

const day = (id: string, change: Partial<HealthDay> = {}): HealthDay => ({
  id,
  steps: 1000,
  distanceMeters: null,
  caloriesKcal: null,
  heartRate: null,
  oxygenSaturation: null,
  syncedAt: 0,
  ...change,
});

describe('health use cases', () => {
  const repo = { saveMany: jest.fn(), listRange: jest.fn() };

  beforeEach(() => {
    repo.saveMany.mockReset().mockResolvedValue(undefined);
    repo.listRange.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [SaveHealthDaysUseCase, GetHealthTrendUseCase, GetHealthDayUseCase, { provide: HealthDayRepository, useValue: repo }],
    });
  });

  it('SaveHealthDays validates every day and saves them in one batch', async () => {
    const days = [day('2026-11-27'), day('2026-11-28')];
    await TestBed.inject(SaveHealthDaysUseCase).execute(days);
    expect(repo.saveMany).toHaveBeenCalledTimes(1);
    expect(repo.saveMany).toHaveBeenCalledWith(days);
  });

  it('SaveHealthDays saves nothing when one day is invalid', async () => {
    const days = [day('2026-11-27'), day('mañana')];
    await expect(TestBed.inject(SaveHealthDaysUseCase).execute(days)).rejects.toThrow(InvalidHealthDayInputError);
    expect(repo.saveMany).not.toHaveBeenCalled();
  });

  it('GetHealthTrend reads exactly the window and builds the trend from it', async () => {
    repo.listRange.mockResolvedValue([day('2026-11-28', { steps: 7000 })]);
    const trend = await TestBed.inject(GetHealthTrendUseCase).execute('2026-11-28', 7);
    expect(repo.listRange).toHaveBeenCalledWith('2026-11-22', '2026-11-28');
    expect(trend.points).toHaveLength(7);
    expect(trend.summary.stepsAvg).toBe(7000);
  });

  it('GetHealthDay returns the stored day, or null when there is none', async () => {
    repo.listRange.mockResolvedValue([day('2026-11-28', { steps: 7000 })]);
    await expect(TestBed.inject(GetHealthDayUseCase).execute('2026-11-28')).resolves.toEqual(day('2026-11-28', { steps: 7000 }));
    expect(repo.listRange).toHaveBeenCalledWith('2026-11-28', '2026-11-28');
    repo.listRange.mockResolvedValue([]);
    await expect(TestBed.inject(GetHealthDayUseCase).execute('2026-11-29')).resolves.toBeNull();
  });
});
