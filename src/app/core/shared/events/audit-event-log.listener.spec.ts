/**
 * audit-event-log.listener.spec.ts
 * TDD strict — RED written before implementation. D-6.
 */
import { TestBed } from '@angular/core/testing';
import { EventBus } from './event-bus';
import { AuditEventLogRepository } from './audit-event-log.repository';
import { AuditEventLogListener } from './audit-event-log.listener';
import { InMemoryEventBus } from './in-memory-event-bus';
import { AuditEvent } from './audit-event';
import { DomainEvent } from './domain-event';

// Mock UUID
const mockRandomUUID = jest.fn(() => 'test-uuid');
beforeAll(() => {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: mockRandomUUID,
    writable: true,
    configurable: true,
  });
});
beforeEach(() => {
  let c = 0;
  mockRandomUUID.mockImplementation(() => `uuid-${++c}`);
});

class MockAuditEventLogRepository extends AuditEventLogRepository {
  readonly appended: AuditEvent[] = [];
  appendError: Error | null = null;

  override async append(event: AuditEvent): Promise<void> {
    if (this.appendError) throw this.appendError;
    this.appended.push(event);
  }

  override async getAll(): Promise<AuditEvent[]> { return [...this.appended]; }
  override async getBySession(): Promise<AuditEvent[]> { return []; }
}

describe('AuditEventLogListener', () => {
  let bus: InMemoryEventBus;
  let repo: MockAuditEventLogRepository;
  let listener: AuditEventLogListener;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryEventBus,
        { provide: EventBus, useExisting: InMemoryEventBus },
        { provide: AuditEventLogRepository, useClass: MockAuditEventLogRepository },
        AuditEventLogListener,
      ],
    });

    bus = TestBed.inject(InMemoryEventBus);
    repo = TestBed.inject(AuditEventLogRepository) as MockAuditEventLogRepository;
    listener = TestBed.inject(AuditEventLogListener);
  });

  it('should subscribe to the bus on start()', async () => {
    listener.start();

    // Verify subscriptions are active by publishing and checking repo
    bus.publish({ name: 'WorkedSetEdited', occurredAt: new Date(), sessionId: 's1', previousSet: {}, newSet: {} } as unknown as DomainEvent);
    // Allow microtask queue to flush
    await Promise.resolve();
    expect(repo.appended.length).toBe(1);
  });

  it('should call repo.append when WorkedSetEdited event is published', async () => {
    listener.start();

    bus.publish({
      name: 'WorkedSetEdited',
      occurredAt: new Date(),
      sessionId: 'session-1',
      previousSet: { id: 'ws-1' },
      newSet: { id: 'ws-1' },
    } as unknown as DomainEvent);

    // Allow microtask queue to flush
    await Promise.resolve();

    expect(repo.appended.length).toBe(1);
    expect(repo.appended[0]?.name).toBe('WorkedSetEdited');
    expect(repo.appended[0]?.sessionId).toBe('session-1');
  });

  it('should call repo.append when WorkedSetRemoved event is published', async () => {
    listener.start();

    bus.publish({
      name: 'WorkedSetRemoved',
      occurredAt: new Date(),
      sessionId: 'session-2',
      removedSet: { id: 'ws-2' },
    } as unknown as DomainEvent);

    await Promise.resolve();

    expect(repo.appended.length).toBe(1);
    expect(repo.appended[0]?.name).toBe('WorkedSetRemoved');
  });

  it('should NOT call repo.append for WorkedSetLogged events', async () => {
    listener.start();

    bus.publish({
      name: 'WorkedSetLogged',
      occurredAt: new Date(),
      sessionId: 'session-3',
    } as unknown as DomainEvent);

    await Promise.resolve();

    expect(repo.appended.length).toBe(0);
  });

  it('should silence errors from repo (error in append does not throw)', async () => {
    listener.start();
    repo.appendError = new Error('Dexie write failed');

    // Should not throw
    expect(() => {
      bus.publish({
        name: 'WorkedSetEdited',
        occurredAt: new Date(),
        sessionId: 's1',
        previousSet: {},
        newSet: {},
      } as unknown as DomainEvent);
    }).not.toThrow();

    // Await microtasks — no uncaught rejection either
    await Promise.resolve();
    await Promise.resolve();
  });
});
