import { RoutineRow } from '@core/db/database';
import { Routine } from '../domain/routine.entity';
import { WeeklySchedule } from '../domain/value-objects/weekly-schedule';

/**
 * Maps a RoutineRow to a Routine domain entity.
 * Handles WeeklySchedule deserialization with graceful degradation (D-23, CC-19):
 * - null row.schedule → entity.schedule = undefined
 * - non-null row.schedule → WeeklySchedule.tryFrom; ok:false → undefined + no throw
 */
export function toRoutine(row: RoutineRow): Routine {
  let schedule: WeeklySchedule | undefined;

  if (row.schedule !== null && row.schedule !== undefined) {
    const result = WeeklySchedule.tryFrom(row.schedule);
    if (result.ok) {
      schedule = result.value;
    } else {
      // Graceful degradation: corrupted/invalid schedule data → treat as not configured
      console.warn('[routine.mapper] Invalid schedule in DB, ignoring:', result.error);
      schedule = undefined;
    }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    schedule,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Maps a Routine domain entity to a RoutineRow for DB persistence.
 * Serializes WeeklySchedule via toJSON (CC-19).
 * undefined schedule → null in DB (backward-compat with existing rows).
 */
export function toRoutineRow(routine: Routine): RoutineRow {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    isActive: routine.isActive,
    schedule: routine.schedule ? WeeklySchedule.toJSON(routine.schedule) : null,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
  };
}
