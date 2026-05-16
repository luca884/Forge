import { toRoutine, toRoutineRow } from './routine.mapper';
import { RoutineRow } from '@core/db/database';
import { Routine } from '../domain/routine.entity';
import { WeeklySchedule } from '../domain/value-objects/weekly-schedule';

const makeRoutineRow = (overrides: Partial<RoutineRow> = {}): RoutineRow => ({
  id: 'r1',
  name: 'Test Routine',
  isActive: false,
  schedule: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 'r1',
  name: 'Test Routine',
  isActive: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('routine.mapper', () => {
  describe('toRoutine(row)', () => {
    it('maps basic fields correctly', () => {
      const row = makeRoutineRow();
      const routine = toRoutine(row);

      expect(routine.id).toBe('r1');
      expect(routine.name).toBe('Test Routine');
      expect(routine.isActive).toBe(false);
    });

    it('maps null schedule to undefined on Routine — D-23/S2', () => {
      // V-68
      const row = makeRoutineRow({ schedule: null });
      const routine = toRoutine(row);
      expect(routine.schedule).toBeUndefined();
    });

    it('maps a valid schedule JSON to WeeklySchedule — D-23/S3', () => {
      const row = makeRoutineRow({ schedule: { monday: 'day-a' } });
      const routine = toRoutine(row);
      expect(routine.schedule).toBeDefined();
      expect(routine.schedule!.monday).toBe('day-a');
    });

    it('maps an invalid/corrupted schedule to undefined (graceful degradation) — D-23/R3', () => {
      // tryFrom rejects { monday: 42 } — mapper must not throw
      const row = makeRoutineRow({ schedule: { monday: 42 as unknown as string } });
      expect(() => toRoutine(row)).not.toThrow();
      const routine = toRoutine(row);
      expect(routine.schedule).toBeUndefined();
    });

    it('preserves optional description field', () => {
      const row = makeRoutineRow({ description: 'My desc' });
      const routine = toRoutine(row);
      expect(routine.description).toBe('My desc');
    });
  });

  describe('toRoutineRow(routine)', () => {
    it('maps undefined schedule to null on RoutineRow', () => {
      const routine = makeRoutine({ schedule: undefined });
      const row = toRoutineRow(routine);
      expect(row.schedule).toBeNull();
    });

    it('maps a WeeklySchedule to its JSON form — D-23/R1', () => {
      const schedule: WeeklySchedule = { tuesday: 'day-b' };
      const routine = makeRoutine({ schedule });
      const row = toRoutineRow(routine);

      expect(row.schedule).not.toBeNull();
      expect(row.schedule!.tuesday).toBe('day-b');
    });
  });

  describe('round-trip', () => {
    it('round-trips a routine with schedule correctly — D-24/V-69', () => {
      // V-69: round-trip with schedule
      const schedule: WeeklySchedule = { tuesday: 'day-b' };
      const original = makeRoutine({ schedule });
      const row = toRoutineRow(original);
      const restored = toRoutine(row);

      expect(restored.schedule).toBeDefined();
      expect(restored.schedule!.tuesday).toBe('day-b');
    });

    it('round-trips a routine without schedule correctly', () => {
      const original = makeRoutine({ schedule: undefined });
      const row = toRoutineRow(original);
      const restored = toRoutine(row);
      expect(restored.schedule).toBeUndefined();
    });
  });
});
