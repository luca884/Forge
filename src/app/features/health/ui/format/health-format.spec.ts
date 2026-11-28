import { formatBpm, formatKcal, formatMeters, formatPercent, formatSteps } from './health-format';

describe('health format', () => {
  it('shows a dash for a missing value', () => {
    for (const format of [formatSteps, formatMeters, formatKcal, formatBpm, formatPercent]) {
      expect(format(null)).toBe('—');
    }
  });

  it('formats steps with the es-AR thousands separator', () => {
    expect(formatSteps(8123)).toBe('8.123');
    expect(formatSteps(0)).toBe('0');
  });

  it('formats distance in meters under a kilometer and in kilometers above', () => {
    expect(formatMeters(850.4)).toBe('850 m');
    expect(formatMeters(6100)).toBe('6,1 km');
    expect(formatMeters(0)).toBe('0 m');
  });

  it('formats calories, beats per minute and percent as whole numbers', () => {
    expect(formatKcal(2210.6)).toBe('2.211 kcal');
    expect(formatBpm(72.4)).toBe('72 lpm');
    expect(formatPercent(96.6)).toBe('97 %');
  });
});
