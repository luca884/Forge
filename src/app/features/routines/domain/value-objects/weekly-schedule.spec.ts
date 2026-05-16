import {
  WeeklySchedule,
  DAYS_OF_WEEK,
  isRestDay,
  getDayId,
} from './weekly-schedule';

describe('WeeklySchedule', () => {
  const makeSchedule = (): WeeklySchedule => ({
    monday: 'day-a-id',
    tuesday: undefined,
    wednesday: 'day-b-id',
  });

  describe('isRestDay(schedule, dow)', () => {
    it('returns true when the day entry is undefined — D-5/S1', () => {
      // V-47
      const schedule = makeSchedule();
      expect(isRestDay(schedule, 'tuesday')).toBe(true);
    });

    it('returns false when the day has a TrainingDay id assigned', () => {
      const schedule = makeSchedule();
      expect(isRestDay(schedule, 'monday')).toBe(false);
    });

    it('returns true when day is not in the schedule at all', () => {
      const schedule = makeSchedule();
      expect(isRestDay(schedule, 'sunday')).toBe(true);
    });
  });

  describe('getDayId(schedule, dow)', () => {
    it('returns the TrainingDay id for a scheduled day — D-5/S2', () => {
      const schedule = makeSchedule();
      expect(getDayId(schedule, 'monday')).toBe('day-a-id');
    });

    it('returns undefined when the day is not in the schedule — D-5/S5', () => {
      const schedule = makeSchedule();
      expect(getDayId(schedule, 'sunday')).toBeUndefined();
    });

    it('returns undefined when the day entry is explicitly undefined', () => {
      const schedule = makeSchedule();
      expect(getDayId(schedule, 'tuesday')).toBeUndefined();
    });
  });

  describe('WeeklySchedule.tryFrom(raw)', () => {
    it('returns ok:true for empty object — all-rest week is valid — D-5/S3', () => {
      // V-48: tryFrom({}) → {ok: true}
      const result = WeeklySchedule.tryFrom({});
      expect(result.ok).toBe(true);
    });

    it('returns ok:true for a valid schedule with string day values', () => {
      const result = WeeklySchedule.tryFrom({ monday: 'day-a-id', tuesday: undefined });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.monday).toBe('day-a-id');
      }
    });

    it('returns ok:false when a day entry is a number — D-5/S4', () => {
      const result = WeeklySchedule.tryFrom({ monday: 42 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when a day entry is an array', () => {
      const result = WeeklySchedule.tryFrom({ monday: ['day-a'] });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when a day entry is an object', () => {
      const result = WeeklySchedule.tryFrom({ monday: { id: 'day-a' } });
      expect(result.ok).toBe(false);
    });

    it('is forgiving: null/undefined input returns empty (ok:true) — AC-11', () => {
      // Task 0.3.3 REFACTOR requirement: forgiving null/undefined input
      expect(WeeklySchedule.tryFrom(null).ok).toBe(true);
      expect(WeeklySchedule.tryFrom(undefined).ok).toBe(true);
    });

    it('is forgiving: ignores unknown keys (not a DayOfWeek)', () => {
      // Task 0.3.3: keys that are not DayOfWeek are silently ignored
      const result = WeeklySchedule.tryFrom({ monday: 'day-a', unknownKey: 'something' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.monday).toBe('day-a');
        expect((result.value as unknown as Record<string, unknown>)['unknownKey']).toBeUndefined();
      }
    });
  });

  describe('WeeklySchedule immutability (withDay)', () => {
    it('withDay returns a new schedule without mutating the original', () => {
      const original: WeeklySchedule = { monday: 'day-a' };
      const updated = WeeklySchedule.withDay(original, 'tuesday', 'day-b');
      expect(updated.tuesday).toBe('day-b');
      expect(original.tuesday).toBeUndefined();
      expect(updated).not.toBe(original);
    });
  });

  describe('toJSON round-trip', () => {
    it('toJSON returns a plain object that can be re-parsed via tryFrom', () => {
      const schedule: WeeklySchedule = { monday: 'day-a', wednesday: 'day-b' };
      const json = WeeklySchedule.toJSON(schedule);
      const result = WeeklySchedule.tryFrom(json);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.monday).toBe('day-a');
        expect(result.value.wednesday).toBe('day-b');
      }
    });
  });

  describe('DAYS_OF_WEEK constant', () => {
    it('contains all 7 days in order', () => {
      expect(DAYS_OF_WEEK).toEqual([
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ]);
    });
  });
});
