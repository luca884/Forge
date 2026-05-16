import { buildWorkerStartPayload, formatRemainingSeconds } from './rest-timer.helpers';

describe('rest-timer.helpers', () => {
  describe('buildWorkerStartPayload()', () => {
    it('returns a start message with the given seconds', () => {
      const msg = buildWorkerStartPayload(90);
      expect(msg).toEqual({ type: 'start', payload: { seconds: 90 } });
    });

    it('returns a start message with 0 seconds', () => {
      const msg = buildWorkerStartPayload(0);
      expect(msg).toEqual({ type: 'start', payload: { seconds: 0 } });
    });

    it('returns a start message with fractional seconds floored', () => {
      const msg = buildWorkerStartPayload(60);
      expect(msg.payload.seconds).toBe(60);
    });
  });

  describe('buildWorkerCancelPayload()', () => {
    it('returns a cancel message', async () => {
      const { buildWorkerCancelPayload } = await import('./rest-timer.helpers');
      const msg = buildWorkerCancelPayload();
      expect(msg).toEqual({ type: 'cancel' });
    });
  });

  describe('formatRemainingSeconds()', () => {
    it('formats 90 seconds as "1:30"', () => {
      expect(formatRemainingSeconds(90)).toBe('1:30');
    });

    it('formats 60 seconds as "1:00"', () => {
      expect(formatRemainingSeconds(60)).toBe('1:00');
    });

    it('formats 5 seconds as "0:05"', () => {
      expect(formatRemainingSeconds(5)).toBe('0:05');
    });

    it('formats 0 seconds as "0:00"', () => {
      expect(formatRemainingSeconds(0)).toBe('0:00');
    });

    it('formats 3661 seconds as "61:01"', () => {
      expect(formatRemainingSeconds(3661)).toBe('61:01');
    });
  });
});
