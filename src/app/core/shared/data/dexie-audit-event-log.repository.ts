/**
 * dexie-audit-event-log.repository.ts
 * Adapter implementing AuditEventLogRepository using the Dexie `auditEvents` table.
 *
 * Append-only: uses `.add()` (not `.put()`) to enforce the invariant that each call
 * inserts a new row with a unique id. CC-22, D-4/R3.
 *
 * D-4, ADR-16.
 */
import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { AuditEventLogRepository, AuditEventFilter } from '@core/shared/events/audit-event-log.repository';
import { AuditEvent } from '@core/shared/events/audit-event';
import { toAuditEvent, toAuditEventRow } from './audit-event.mapper';

@Injectable()
export class DexieAuditEventLogRepository extends AuditEventLogRepository {
  private readonly db = inject(ForgeDatabaseService);

  /** Append-only insert. Never overwrites existing rows. CC-22, D-4/R3. */
  async append(event: AuditEvent): Promise<void> {
    await this.db.auditEvents.add(toAuditEventRow(event));
  }

  async getAll(filters?: AuditEventFilter): Promise<AuditEvent[]> {
    let rows = await this.db.auditEvents.toArray();

    if (filters?.name !== undefined) {
      rows = rows.filter(r => r.name === filters.name);
    }
    if (filters?.sessionId !== undefined) {
      rows = rows.filter(r => r.sessionId === filters.sessionId);
    }

    return rows.map(toAuditEvent);
  }

  async getBySession(sessionId: string): Promise<AuditEvent[]> {
    const rows = await this.db.auditEvents
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    return rows.map(toAuditEvent);
  }
}
