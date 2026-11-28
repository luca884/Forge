import { barGeometry, lineGeometry } from './trend-geometry';

describe('barGeometry', () => {
  it('scales bars to the largest value, anchored to the bottom, one slot per day', () => {
    const bars = barGeometry([50, 100, 25], 300, 80, 0);
    expect(bars).toEqual([
      { x: 0, y: 40, width: 100, height: 40 },
      { x: 100, y: 0, width: 100, height: 80 },
      { x: 200, y: 60, width: 100, height: 20 },
    ]);
  });

  it('leaves a gap between bars and keeps a day without data empty', () => {
    const bars = barGeometry([10, null, 10], 300, 80, 4);
    expect(bars[1]).toBeNull();
    expect(bars[0]).toEqual({ x: 2, y: 0, width: 96, height: 80 });
    expect(bars[2]).toEqual({ x: 202, y: 0, width: 96, height: 80 });
  });

  it('draws zero values and an all-zero series as empty bars, never as NaN', () => {
    expect(barGeometry([0, 0], 100, 80, 0)).toEqual([
      { x: 0, y: 80, width: 50, height: 0 },
      { x: 50, y: 80, width: 50, height: 0 },
    ]);
  });

  it('returns nothing for an empty series', () => {
    expect(barGeometry([], 100, 80, 0)).toEqual([]);
  });
});

describe('lineGeometry', () => {
  it('spreads points evenly and maps the lowest value to the bottom and the highest to the top, inside the padding', () => {
    const { segments } = lineGeometry([60, 90, 75], 200, 100, 10);
    expect(segments).toEqual([
      [
        { x: 0, y: 90 },
        { x: 100, y: 10 },
        { x: 200, y: 50 },
      ],
    ]);
  });

  it('breaks the line at days without data', () => {
    const { segments, dots } = lineGeometry([60, null, 70, 80], 300, 100, 0);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveLength(1);
    expect(segments[1]).toHaveLength(2);
    expect(dots).toHaveLength(3);
  });

  it('centers a flat series and a single point', () => {
    expect(lineGeometry([70, 70], 100, 100, 10).dots).toEqual([
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ]);
    expect(lineGeometry([70], 100, 100, 10).dots).toEqual([{ x: 50, y: 50 }]);
  });

  it('returns nothing when no day has data', () => {
    expect(lineGeometry([null, null], 100, 100, 10)).toEqual({ segments: [], dots: [] });
  });
});
