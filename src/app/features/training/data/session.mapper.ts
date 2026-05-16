import { SessionRow } from '@core/db/database';
import { Session } from '../domain/session.entity';
import { SessionStatus } from '../domain/session-status';

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    routineId: row.routineId,
    dayId: row.dayId,
    date: row.date,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    status: row.status as SessionStatus,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toSessionRow(session: Session): SessionRow {
  return {
    id: session.id,
    routineId: session.routineId,
    dayId: session.dayId,
    date: session.date,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    status: session.status,
    notes: session.notes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
