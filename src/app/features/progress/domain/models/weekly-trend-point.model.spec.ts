import { WeeklyTrendPoint } from './weekly-trend-point.model';

describe('WeeklyTrendPoint model', () => {
  it('accepts a populated weekly trend point', () => {
    const point: WeeklyTrendPoint = {
      weekStart: '2026-07-13',
      volumeKg: 4500,
      sessions: 3,
    };
    expect(point.weekStart).toBe('2026-07-13');
    expect(point.volumeKg).toBe(4500);
    expect(point.sessions).toBe(3);
  });
});
