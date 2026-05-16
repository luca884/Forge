import { toAuditEvent, toAuditEventRow } from './audit-event.mapper';
import { AuditEvent } from '@core/shared/events/audit-event';
import { AuditEventRow } from '@core/db/database';

const mockRandomUUID = jest.fn(() => 'test-uuid');
beforeAll(() => {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: mockRandomUUID,
    writable: true,
    configurable: true,
  });
});

describe('AuditEventMapper', () => {
  const sampleEvent: AuditEvent = {
    id: 'ae-1',
    name: 'WorkedSetEdited',
    occurredAt: new Date('2026-05-01T10:00:00Z'),
    sessionId: 'session-1',
    payload: '{"kind":"WorkedSetEdited","setId":"ws-1"}',
  };

  describe('toAuditEventRow', () => {
    it('should map AuditEvent to AuditEventRow with JSON payload', () => {
      const row = toAuditEventRow(sampleEvent);

      expect(row.id).toBe('ae-1');
      expect(row.name).toBe('WorkedSetEdited');
      expect(row.occurredAt).toEqual(sampleEvent.occurredAt);
      expect(row.sessionId).toBe('session-1');
      expect(row.payload).toBe('{"kind":"WorkedSetEdited","setId":"ws-1"}');
    });

    it('should handle event without sessionId', () => {
      const eventNoSession: AuditEvent = { ...sampleEvent, sessionId: undefined };
      const row = toAuditEventRow(eventNoSession);
      expect(row.sessionId).toBeUndefined();
    });
  });

  describe('toAuditEvent', () => {
    it('should map AuditEventRow back to AuditEvent (round-trip)', () => {
      const row: AuditEventRow = {
        id: 'ae-1',
        name: 'WorkedSetEdited',
        occurredAt: new Date('2026-05-01T10:00:00Z'),
        sessionId: 'session-1',
        payload: '{"kind":"WorkedSetEdited","setId":"ws-1"}',
      };
      const event = toAuditEvent(row);

      expect(event.id).toBe('ae-1');
      expect(event.name).toBe('WorkedSetEdited');
      expect(event.sessionId).toBe('session-1');
      expect(event.payload).toBe('{"kind":"WorkedSetEdited","setId":"ws-1"}');
    });
  });

  describe('round-trip', () => {
    it('should round-trip toRow→toDomain returning equivalent event', () => {
      const row = toAuditEventRow(sampleEvent);
      const recovered = toAuditEvent(row);

      expect(recovered.id).toBe(sampleEvent.id);
      expect(recovered.name).toBe(sampleEvent.name);
      expect(recovered.occurredAt.getTime()).toBe(sampleEvent.occurredAt.getTime());
      expect(recovered.sessionId).toBe(sampleEvent.sessionId);
      expect(recovered.payload).toBe(sampleEvent.payload);
    });

    it('should throw with row.id when payload is corrupt', () => {
      const corruptRow: AuditEventRow = {
        id: 'corrupt-row-id',
        name: 'WorkedSetEdited',
        occurredAt: new Date(),
        payload: 'NOT_VALID_JSON{{{',
      };
      expect(() => toAuditEvent(corruptRow)).toThrow('corrupt-row-id');
    });
  });
});
