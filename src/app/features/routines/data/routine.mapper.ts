import { RoutineRow } from '@core/db/database';
import { Routine } from '../domain/routine.entity';

export function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toRoutineRow(routine: Routine): RoutineRow {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    isActive: routine.isActive,
    schedule: null,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
  };
}
