import { Routine } from './routine.entity';
import { WeeklySchedule } from './value-objects/weekly-schedule';

/**
 * Spec for Routine entity — D-22, D-24.
 * Verifies shape conformance and optional schedule field.
 */

const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 'routine-1',
  name: 'Mi Rutina',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Routine entity — D-22, D-24', () => {
  it('creates a Routine without schedule — D-22/S1 (schedule is optional)', () => {
    const routine = makeRoutine();
    expect(routine.id).toBe('routine-1');
    expect(routine.name).toBe('Mi Rutina');
    expect(routine.isActive).toBe(true);
    // schedule is not required — must be absent/undefined
    expect(routine.schedule).toBeUndefined();
  });

  it('creates a Routine with a schedule — D-22/S2', () => {
    const schedule: WeeklySchedule = { monday: 'day-a-id', wednesday: 'day-b-id' };
    const routine = makeRoutine({ schedule });

    expect(routine.schedule).toBeDefined();
    expect(routine.schedule!.monday).toBe('day-a-id');
    expect(routine.schedule!.wednesday).toBe('day-b-id');
    // Tuesday not set = rest day (undefined)
    expect(routine.schedule!.tuesday).toBeUndefined();
  });

  it('preserves all pre-existing fields when schedule is added — D-22/R4', () => {
    const schedule: WeeklySchedule = { friday: 'day-c-id' };
    const routine = makeRoutine({ description: 'Strength focused', schedule });

    expect(routine.id).toBe('routine-1');
    expect(routine.name).toBe('Mi Rutina');
    expect(routine.description).toBe('Strength focused');
    expect(routine.isActive).toBe(true);
    expect(routine.createdAt).toEqual(new Date('2024-01-01'));
    expect(routine.updatedAt).toEqual(new Date('2024-01-01'));
    expect(routine.schedule!.friday).toBe('day-c-id');
  });

  it('distinguishes between no-schedule-set (undefined) and empty schedule (all rest days)', () => {
    const noSchedule = makeRoutine({ schedule: undefined });
    const emptySchedule = makeRoutine({ schedule: {} });

    // undefined = not configured
    expect(noSchedule.schedule).toBeUndefined();
    // {} = configured but all days are rest
    expect(emptySchedule.schedule).toBeDefined();
    expect(emptySchedule.schedule!.monday).toBeUndefined();
  });
});
