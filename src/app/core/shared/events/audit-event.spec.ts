import { createAuditEvent, AuditEvent } from './audit-event';

// jsdom doesn't implement crypto.randomUUID; mock it globally.
const mockRandomUUID = jest.fn(() => '00000000-0000-4000-8000-000000000000');
beforeAll(() => {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: mockRandomUUID,
    writable: true,
    configurable: true,
  });
});
beforeEach(() => {
  let callCount = 0;
  mockRandomUUID.mockImplementation(() => `uuid-${++callCount}`);
});

describe('AuditEvent entity', () => {
  it('should create a WorkedSetEdited event with correct name and payload', () => {
    const payload = JSON.stringify({ kind: 'WorkedSetEdited', setId: 'ws-1' });
    const event = createAuditEvent('WorkedSetEdited', payload, 'session-1');

    expect(event.name).toBe('WorkedSetEdited');
    expect(event.payload).toBe(payload);
    expect(event.sessionId).toBe('session-1');
    expect(event.id).toBeTruthy();
    expect(event.id.length).toBeGreaterThan(0);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should create a WorkedSetRemoved event without sessionId', () => {
    const payload = JSON.stringify({ kind: 'WorkedSetRemoved', setId: 'ws-2' });
    const event = createAuditEvent('WorkedSetRemoved', payload);

    expect(event.name).toBe('WorkedSetRemoved');
    expect(event.sessionId).toBeUndefined();
  });

  it('should generate unique ids for each event', () => {
    const e1 = createAuditEvent('WorkedSetEdited', '{}');
    const e2 = createAuditEvent('WorkedSetEdited', '{}');
    expect(e1.id).not.toBe(e2.id);
  });

  it('should have a recent occurredAt timestamp', () => {
    const before = new Date();
    const event = createAuditEvent('WorkedSetEdited', '{}');
    const after = new Date();

    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should be structurally readonly (TypeScript enforces at compile time)', () => {
    const event: AuditEvent = createAuditEvent('WorkedSetEdited', '{}');
    // Runtime check: fields are present and accessible
    expect(typeof event.id).toBe('string');
    expect(typeof event.name).toBe('string');
    expect(typeof event.payload).toBe('string');
  });
});
