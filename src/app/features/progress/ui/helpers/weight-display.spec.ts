import { displayWeightValue } from './weight-display';

describe('displayWeightValue', () => {
  it('returns the kg value untouched for kg', () => {
    expect(displayWeightValue(102.5, 'kg')).toBe(102.5);
  });

  it('converts to lb with the same factor and rounding as DisplayWeightPipe', () => {
    // 100 kg → "220.5 lb" in DisplayWeightPipe
    expect(displayWeightValue(100, 'lb')).toBe(220.5);
  });

  it('rounds kg values to one decimal so floating point noise never reaches the screen', () => {
    expect(displayWeightValue(126.66666666666667, 'kg')).toBe(126.7);
  });
});
