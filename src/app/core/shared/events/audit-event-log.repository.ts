import { AuditEvent } from './audit-event';

export interface AuditEventFilter {
  name?: string;
  sessionId?: string;
}

export abstract class AuditEventLogRepository {
  abstract append(event: AuditEvent): Promise<void>;
  abstract getAll(filters?: AuditEventFilter): Promise<AuditEvent[]>;
  abstract getBySession(sessionId: string): Promise<AuditEvent[]>;
}
