/**
 * WeeklySchedule VO — maps each DayOfWeek to an optional TrainingDay.id.
 * undefined for a given day means rest day.
 *
 * D-5 spec. CC-19: serialization/deserialization goes through tryFrom validator.
 * No imports from Angular, rxjs, dexie, data/, or ui/.
 */

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export interface WeeklySchedule {
  readonly monday?: string;
  readonly tuesday?: string;
  readonly wednesday?: string;
  readonly thursday?: string;
  readonly friday?: string;
  readonly saturday?: string;
  readonly sunday?: string;
}

export function isRestDay(schedule: WeeklySchedule, dow: DayOfWeek): boolean {
  return schedule[dow] === undefined;
}

export function getDayId(schedule: WeeklySchedule, dow: DayOfWeek): string | undefined {
  return schedule[dow];
}

// Namespace-style static methods on WeeklySchedule
export namespace WeeklySchedule {
  /**
   * Validates and parses a raw unknown value into a WeeklySchedule.
   * Forgiving: null/undefined input returns empty schedule (ok: true).
   * Unknown keys (non-DayOfWeek) are silently ignored.
   * Rejects entries where the value is not string | undefined.
   *
   * D-5/R2, D-5/R6, AC-11, CC-19.
   */
  export function tryFrom(
    raw: unknown,
  ): { ok: true; value: WeeklySchedule } | { ok: false; error: string } {
    // Forgiving: null/undefined → empty schedule
    if (raw === null || raw === undefined) {
      return { ok: true, value: {} };
    }

    if (typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, error: 'WeeklySchedule must be a plain object' };
    }

    const obj = raw as Record<string, unknown>;
    const schedule: Partial<WeeklySchedule> = {};

    for (const day of DAYS_OF_WEEK) {
      const value = obj[day];
      if (value === undefined || value === null) {
        // Rest day — do not include in result (leave as undefined)
        continue;
      }
      if (typeof value !== 'string') {
        return {
          ok: false,
          error: `WeeklySchedule.${day} must be a string or undefined. Received: ${typeof value}`,
        };
      }
      schedule[day] = value;
    }

    return { ok: true, value: schedule as WeeklySchedule };
  }

  /**
   * Returns a new WeeklySchedule with the given day set to the provided dayId.
   * Immutable: does not mutate the original.
   */
  export function withDay(
    schedule: WeeklySchedule,
    dow: DayOfWeek,
    dayId: string | undefined,
  ): WeeklySchedule {
    return { ...schedule, [dow]: dayId };
  }

  /**
   * Serializes a WeeklySchedule to a plain JSON-compatible object.
   * Suitable for storage in Dexie (CC-19).
   */
  export function toJSON(schedule: WeeklySchedule): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const day of DAYS_OF_WEEK) {
      const value = schedule[day];
      if (value !== undefined) {
        result[day] = value;
      }
    }
    return result;
  }
}
