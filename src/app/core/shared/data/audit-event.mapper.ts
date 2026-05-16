import { AuditEvent, AuditEventName } from '@core/shared/events/audit-event';
import { AuditEventRow } from '@core/db/database';

export function toAuditEventRow(event: AuditEvent): AuditEventRow {
  return {
    id: event.id,
    name: event.name,
    occurredAt: event.occurredAt,
    sessionId: event.sessionId,
    payload: event.payload,
  };
}

export function toAuditEvent(row: AuditEventRow): AuditEvent {
  // Validate that the payload is valid JSON — corrupt rows should fail loud.
  try {
    JSON.parse(row.payload);
  } catch {
    throw new Error(
      `[audit-event.mapper] corrupt payload row.id=${row.id}`,
    );
  }

  return {
    id: row.id,
    name: row.name as AuditEventName,
    occurredAt: row.occurredAt,
    sessionId: row.sessionId,
    payload: row.payload,
  };
}
