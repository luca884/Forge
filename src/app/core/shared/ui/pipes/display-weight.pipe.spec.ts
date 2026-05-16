import { DisplayWeightPipe } from './display-weight.pipe';

describe('DisplayWeightPipe', () => {
  let pipe: DisplayWeightPipe;

  beforeEach(() => {
    pipe = new DisplayWeightPipe();
  });

  it('returns kg value with kg unit (no conversion)', () => {
    expect(pipe.transform(100, 'kg')).toBe('100 kg');
  });

  it('converts 100 kg to 220.5 lb (1 decimal)', () => {
    expect(pipe.transform(100, 'lb')).toBe('220.5 lb');
  });

  it('converts 60 kg to 132.3 lb', () => {
    expect(pipe.transform(60, 'lb')).toBe('132.3 lb');
  });

  it('converts 0 kg to 0.0 lb', () => {
    expect(pipe.transform(0, 'lb')).toBe('0.0 lb');
  });

  it('preserves decimal kg values as-is', () => {
    expect(pipe.transform(75.5, 'kg')).toBe('75.5 kg');
  });

  it('converts 1 kg correctly to lb', () => {
    expect(pipe.transform(1, 'lb')).toBe('2.2 lb');
  });
});
