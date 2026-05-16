import 'fake-indexeddb/auto';
import { ForgeDatabase, AuditEventRow } from './database';

describe('ForgeDatabase — version chain', () => {
  let db: ForgeDatabase;

  beforeEach(async () => {
    db = new ForgeDatabase();
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('should open at version 3', async () => {
    expect(db.verno).toBe(3);
  });

  it('should have auditEvents table', () => {
    expect(db.auditEvents).toBeDefined();
  });

  it('should persist and retrieve an AuditEventRow', async () => {
    const row: AuditEventRow = {
      id: 'ae-1',
      name: 'WorkedSetEdited',
      occurredAt: new Date(),
      sessionId: 'session-1',
      payload: '{"kind":"WorkedSetEdited"}',
    };
    await db.auditEvents.add(row);
    const found = await db.auditEvents.get('ae-1');
    expect(found).toBeDefined();
    expect(found?.name).toBe('WorkedSetEdited');
  });

  it('should support index on name in auditEvents', async () => {
    const row: AuditEventRow = {
      id: 'ae-2',
      name: 'WorkedSetRemoved',
      occurredAt: new Date(),
      payload: '{}',
    };
    await db.auditEvents.add(row);
    const found = await db.auditEvents.where('name').equals('WorkedSetRemoved').toArray();
    expect(found.length).toBe(1);
  });

  it('should have startedAt index on sessions', async () => {
    const now = new Date();
    await db.sessions.add({
      id: 's-1',
      routineId: 'r-1',
      dayId: 'd-1',
      date: '2026-05-01',
      startedAt: now,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    });
    const found = await db.sessions.where('startedAt').aboveOrEqual(now).toArray();
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('ProfileRow should accept preferredUnit field', async () => {
    const now = new Date();
    await db.profile.add({
      id: 'me',
      name: 'Luca',
      preferredUnit: 'kg',
      createdAt: now,
      updatedAt: now,
    });
    const row = await db.profile.get('me');
    expect(row?.preferredUnit).toBe('kg');
  });

  it('ProfileRow without preferredUnit should still load without error', async () => {
    const now = new Date();
    await db.profile.add({
      id: 'me',
      name: 'Luca',
      createdAt: now,
      updatedAt: now,
    });
    const row = await db.profile.get('me');
    expect(row).toBeDefined();
    expect(row?.preferredUnit).toBeUndefined();
  });
});
