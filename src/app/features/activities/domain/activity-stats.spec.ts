import type { TrackPoint } from './activity.entity';
import { computeStats } from './activity-stats';

function point(lon = 0, time: number | null = null, ele: number | null = null): TrackPoint {
  return { lat: 0, lon, time, ele };
}

function equatorialLongitude(meters: number): number {
  return (meters * 180) / (Math.PI * 6_371_008.8);
}

const noOtherStats = {
  elapsedSeconds: null,
  movingSeconds: null,
  avgSpeedKmh: null,
  elevationGainMeters: null,
};

describe('computeStats', () => {
  it.each([[], [point(0, 1000, 10)]].map((points) => ({ points })))(
    'returns only zero distance for fewer than two points: $points',
    ({ points }) => {
      expect(computeStats(points)).toStrictEqual({ distanceMeters: 0, ...noOtherStats });
    },
  );

  it('measures distance without time: (0, 0) to (0, 0.001) is about 111.19 m', () => {
    const { distanceMeters, ...otherStats } = computeStats([point(), point(0.001)]);
    expect(distanceMeters).toBeCloseTo(111.19, 0);
    expect(otherStats).toStrictEqual(noOtherStats);
  });

  it('takes 60 seconds to move 120 m at 7.2 km/h', () => {
    const stats = computeStats([point(0, 0), point(equatorialLongitude(120), 60_000)]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(120),
      elapsedSeconds: 60,
      movingSeconds: 60,
      avgSpeedKmh: expect.closeTo(7.2),
      elevationGainMeters: null,
    });
  });

  it('does not count a segment slower than 0.5 m/s as moving', () => {
    const stats = computeStats([point(0, 0), point(equatorialLongitude(29), 60_000)]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(29),
      elapsedSeconds: 60,
      movingSeconds: 0,
      avgSpeedKmh: null,
      elevationGainMeters: null,
    });
  });

  it('counts a segment moving at exactly 0.5 m/s', () => {
    const stats = computeStats([point(0, 0), point(equatorialLongitude(30), 60_000)]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(30),
      elapsedSeconds: 60,
      movingSeconds: 60,
      avgSpeedKmh: expect.closeTo(1.8),
      elevationGainMeters: null,
    });
  });

  it('sums all distance, but only moving segments contribute to moving time and average speed', () => {
    const stats = computeStats([
      point(0, 0),
      point(equatorialLongitude(120), 60_000),
      point(equatorialLongitude(130), 120_000),
      point(equatorialLongitude(310), 180_000),
    ]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(310),
      elapsedSeconds: 180,
      movingSeconds: 120,
      avgSpeedKmh: expect.closeTo(9),
      elevationGainMeters: null,
    });
  });

  it.each([
    { firstTime: null, lastTime: 120_000 },
    { firstTime: 0, lastTime: null },
  ])('allows a timed segment when the first or last time is missing: %j', ({ firstTime, lastTime }) => {
    const stats = computeStats([
      point(0, firstTime),
      point(equatorialLongitude(120), 60_000),
      point(equatorialLongitude(240), lastTime),
    ]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(240),
      elapsedSeconds: null,
      movingSeconds: 60,
      avgSpeedKmh: expect.closeTo(7.2),
      elevationGainMeters: null,
    });
  });

  it('does not connect timed points across a missing time', () => {
    const stats = computeStats([point(0, 0), point(0.001), point(0.002, 60_000)]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(222.39),
      elapsedSeconds: 60,
      movingSeconds: 0,
      avgSpeedKmh: null,
      elevationGainMeters: null,
    });
  });

  it('ignores segments with duplicate or decreasing timestamps when measuring movement', () => {
    const stats = computeStats([point(0, 2000), point(0.001, 2000), point(0.002, 1000)]);
    expect(stats).toStrictEqual({
      distanceMeters: expect.closeTo(222.39),
      elapsedSeconds: -1,
      movingSeconds: 0,
      avgSpeedKmh: null,
      elevationGainMeters: null,
    });
  });

  it.each([
    { elevations: [null, 100], expected: null },
    { elevations: [100, 101, 99, 102], expected: 0 },
    { elevations: [100, 101, 99, null, 110], expected: 10 },
    { elevations: [100, 101, 102, 103, 99, 109], expected: 13 },
  ])('measures gain with a 2 m hysteresis: $elevations yields $expected', ({ elevations, expected }) => {
    const stats = computeStats(elevations.map((ele) => point(0, null, ele)));
    expect(stats).toStrictEqual({
      distanceMeters: 0,
      ...noOtherStats,
      elevationGainMeters: expected,
    });
  });
});
