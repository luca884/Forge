import { formatDistance, formatDuration, formatElevationGain, formatSpeed } from './activity-format';

describe('activity formatting', () => {
  it.each([[850, '850 m'], [5420, '5,42 km'], [0, '0 m'], [1000, '1 km'], [null, '—']])(
    'formats distance %s as %s', (value, expected) => expect(formatDistance(value)).toBe(expected),
  );

  it.each([[45, '45 s'], [60, '1 min'], [2530, '42 min'], [3900, '1 h 05 min'], [7200, '2 h 00 min'], [null, '—']])(
    'formats duration %s as %s', (value, expected) => expect(formatDuration(value)).toBe(expected),
  );

  it.each([[7.2, '7,2 km/h'], [null, '—']])(
    'formats speed %s as %s', (value, expected) => expect(formatSpeed(value)).toBe(expected),
  );

  it.each([[120.4, '+120 m'], [null, '—']])(
    'formats elevation gain %s as %s', (value, expected) => expect(formatElevationGain(value)).toBe(expected),
  );
});
