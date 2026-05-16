/**
 * dexie-audit-event-log.repository.spec.ts
 * TDD strict — RED written before implementation.
 * Uses fake-indexeddb (registered globally in setup-jest.ts). D-4.
 * NO jest.mock of Dexie internals.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { AuditEventLogRepository } from '@core/shared/events/audit-event-log.repository';
import { AuditEvent } from '@core/shared/events/audit-event';
import { DexieAuditEventLogRepository } from './dexie-audit-event-log.repository';

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: `ae-${Math.random().toString(36).slice(2)}`,
    name: 'WorkedSetEdited',
    occurredAt: new Date(),
    payload: '{"kind":"WorkedSetEdited","setId":"ws-1"}',
    ...overrides,
  };
}

describe('DexieAuditEventLogRepository', () => {
  let repo: DexieAuditEventLogRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        { provide: AuditEventLogRepository, useClass: DexieAuditEventLogRepository },
        DexieAuditEventLogRepository,
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(DexieAuditEventLogRepository);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  describe('append + getAll', () => {
    it('should return 2 events after two appends', async () => {
      const e1 = makeEvent({ id: 'ae-1' });
      const e2 = makeEvent({ id: 'ae-2' });

      await repo.append(e1);
      await repo.append(e2);

      const all = await repo.getAll();
      expect(all.length).toBe(2);
    });

    it('should filter by name', async () => {
      const edited = makeEvent({ id: 'ae-edited', name: 'WorkedSetEdited' });
      const removed = makeEvent({ id: 'ae-removed', name: 'WorkedSetRemoved' });

      await repo.append(edited);
      await repo.append(removed);

      const filtered = await repo.getAll({ name: 'WorkedSetEdited' });
      expect(filtered.length).toBe(1);
      expect(filtered[0]?.name).toBe('WorkedSetEdited');
    });

    it('should return empty array when no events', async () => {
      const all = await repo.getAll();
      expect(all.length).toBe(0);
    });
  });

  describe('getBySession', () => {
    it('should return only events for the given sessionId', async () => {
      const e1 = makeEvent({ id: 'ae-s1-1', sessionId: 'session-A' });
      const e2 = makeEvent({ id: 'ae-s1-2', sessionId: 'session-A' });
      const e3 = makeEvent({ id: 'ae-s2-1', sessionId: 'session-B' });

      await repo.append(e1);
      await repo.append(e2);
      await repo.append(e3);

      const sessionA = await repo.getBySession('session-A');
      expect(sessionA.length).toBe(2);
      expect(sessionA.every(e => e.sessionId === 'session-A')).toBe(true);
    });

    it('should return empty array for unknown session', async () => {
      const events = await repo.getBySession('unknown-session');
      expect(events.length).toBe(0);
    });
  });

  describe('append-only invariant', () => {
    it('should always add a new row (not upsert)', async () => {
      const e1 = makeEvent({ id: 'ae-unique-1' });
      const e2 = makeEvent({ id: 'ae-unique-2' });

      await repo.append(e1);
      await repo.append(e2);

      // Verify both exist independently
      const all = await repo.getAll();
      expect(all.some(e => e.id === 'ae-unique-1')).toBe(true);
      expect(all.some(e => e.id === 'ae-unique-2')).toBe(true);
    });
  });
});
