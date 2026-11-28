import type { HealthDay } from './health-day.entity';
import { addDays, buildHealthTrend } from './health-trend';

const day = (id: string, change: Partial<HealthDay> = {}): HealthDay => ({
  id,
  steps: null,
  distanceMeters: null,
  caloriesKcal: null,
  heartRate: null,
  oxygenSaturation: null,
  syncedAt: 0,
  ...change,
});

describe('addDays', () => {
  it('moves across month, year and leap-day boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is not affected by daylight saving changes', () => {
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });
});

describe('buildHealthTrend', () => {
  it('returns one point per day of the window, oldest first, ending on the given day', () => {
    const trend = buildHealthTrend([], '2026-11-28', 3);
    expect(trend.points.map((p) => p.id)).toEqual(['2026-11-26', '2026-11-27', '2026-11-28']);
  });

  it('fills days with no stored row with empty values', () => {
    const trend = buildHealthTrend([day('2026-11-27', { steps: 100 })], '2026-11-28', 2);
    expect(trend.points).toEqual([
      { id: '2026-11-27', steps: 100, distanceMeters: null, caloriesKcal: null, heartRateAvg: null, oxygenSaturationAvg: null },
      { id: '2026-11-28', steps: null, distanceMeters: null, caloriesKcal: null, heartRateAvg: null, oxygenSaturationAvg: null },
    ]);
  });

  it('ignores stored days outside the window', () => {
    const trend = buildHealthTrend([day('2026-11-20', { steps: 999 }), day('2026-11-29', { steps: 999 })], '2026-11-28', 2);
    expect(trend.points.every((p) => p.steps === null)).toBe(true);
    expect(trend.summary.daysWithData).toBe(0);
  });

  it('averages steps over the days that have them, not over the whole window', () => {
    const days = [day('2026-11-26', { steps: 6000 }), day('2026-11-27'), day('2026-11-28', { steps: 9000 })];
    expect(buildHealthTrend(days, '2026-11-28', 3).summary.stepsAvg).toBe(7500);
  });

  it('weights the heart rate and oxygen averages by their sample counts', () => {
    const days = [
      day('2026-11-27', { heartRate: { avg: 60, min: 50, max: 90, samples: 1 }, oxygenSaturation: { avg: 98, min: 97, max: 99, samples: 1 } }),
      day('2026-11-28', { heartRate: { avg: 80, min: 55, max: 120, samples: 3 }, oxygenSaturation: { avg: 94, min: 92, max: 96, samples: 3 } }),
    ];
    const { summary, points } = buildHealthTrend(days, '2026-11-28', 2);
    expect(summary.heartRateAvg).toBe(75);
    expect(summary.oxygenSaturationAvg).toBe(95);
    expect(points[1]?.heartRateAvg).toBe(80);
  });

  it('counts the days that have at least one value and reports null averages when there is nothing', () => {
    const days = [day('2026-11-27', { steps: 1 }), day('2026-11-28')];
    const { summary } = buildHealthTrend(days, '2026-11-28', 2);
    expect(summary.daysWithData).toBe(1);
    const empty = buildHealthTrend([], '2026-11-28', 2).summary;
    expect(empty).toEqual({ daysWithData: 0, stepsAvg: null, heartRateAvg: null, oxygenSaturationAvg: null });
  });
});
