import { generateUUID } from '@core/shared/utils/uuid';

export type AuditEventName = 'WorkedSetEdited' | 'WorkedSetRemoved';

export type AuditEventPayload =
  | { readonly kind: 'WorkedSetEdited'; readonly setId: string; readonly previous: unknown; readonly current: unknown }
  | { readonly kind: 'WorkedSetRemoved'; readonly setId: string; readonly removed: unknown };

export interface AuditEvent {
  readonly id: string;
  readonly name: AuditEventName;
  readonly occurredAt: Date;
  readonly sessionId?: string;
  readonly payload: string; // JSON-serialized AuditEventPayload
}

export function createAuditEvent(
  name: AuditEventName,
  payload: string,
  sessionId?: string,
): AuditEvent {
  return {
    id: generateUUID(),
    name,
    occurredAt: new Date(),
    sessionId,
    payload,
  };
}
