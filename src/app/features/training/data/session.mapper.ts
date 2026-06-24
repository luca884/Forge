import { SessionRow } from '@core/db/database';
import { Session } from '../domain/session.entity';
import { SessionStatus } from '../domain/session-status';

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    routineId: row.routineId,
    dayId: row.dayId,
    date: row.date,
    startedAt: new Date(row.startedAt),
    endedAt: row.endedAt != null ? new Date(row.endedAt) : undefined,
    status: row.status as SessionStatus,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
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
