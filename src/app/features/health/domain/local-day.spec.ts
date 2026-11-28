import { dayBounds, localDayId } from './local-day';

describe('local day', () => {
  it('names a moment by its local calendar day, padding month and day', () => {
    expect(localDayId(new Date(2026, 0, 5, 0, 0, 0))).toBe('2026-01-05');
    expect(localDayId(new Date(2026, 10, 27, 23, 59, 59, 999))).toBe('2026-11-27');
  });

  it('bounds a day from its local midnight to the next local midnight', () => {
    const { fromMs, toMs } = dayBounds('2026-11-27');
    expect(fromMs).toBe(new Date(2026, 10, 27).getTime());
    expect(toMs).toBe(new Date(2026, 10, 28).getTime());
  });

  it('crosses month and year ends', () => {
    expect(dayBounds('2026-12-31').toMs).toBe(new Date(2027, 0, 1).getTime());
  });
});
