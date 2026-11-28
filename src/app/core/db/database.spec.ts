import 'fake-indexeddb/auto';
import Dexie from 'dexie';
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

  it('opens at version 5 with the activity and health indexes', () => {
    expect(db.verno).toBe(5);
    expect(db.table('healthDaily').schema.primKey.keyPath).toBe('id');
    expect(db.table('healthDaily').schema.indexes.map(({ name }) => name)).toEqual(['syncedAt']);
    expect(db.table('activities').schema.primKey.keyPath).toBe('id');
    expect(db.table('activities').schema.indexes.map(({ name }) => name)).toEqual(['startedAt', 'importedAt']);
    expect(db.table('activityTracks').schema.primKey.keyPath).toBe('activityId');
  });

  it('preserves every v3 store and its data on upgrade', async () => {
    await db.delete();
    const schema = {
      profile: 'id',
      routines: 'id, isActive',
      trainingDays: 'id, routineId',
      exercises: 'id, muscleGroup, isCustom, name',
      sessions: 'id, date, routineId, dayId, status, startedAt',
      workedSets: 'id, sessionId, exerciseId, isPR',
      personalRecords: 'id, exerciseId, trackingType, achievedAt',
      auditEvents: 'id, name, occurredAt, sessionId',
    };
    const legacy = new Dexie('forge');
    legacy.version(3).stores(schema);
    const at = structuredClone(new Date('2026-05-01T00:00:00Z'));
    try {
      await legacy.open();
      for (const table of Object.keys(schema)) {
        await legacy.table(table).add({ id: table, createdAt: at, startedAt: at });
      }
    } finally {
      legacy.close();
    }

    await db.open();
    expect(db.verno).toBe(5);
    for (const [table, definition] of Object.entries(schema)) {
      const { primKey, indexes } = db.table(table).schema;
      expect([primKey.name, ...indexes.map(({ name }) => name)].join(', ')).toBe(definition);
      expect(await db.table(table).toArray()).toEqual([{ id: table, createdAt: at, startedAt: at }]);
    }
    expect(await db.table('activities').count()).toBe(0);
    expect(await db.table('activityTracks').count()).toBe(0);
    expect(await db.table('healthDaily').count()).toBe(0);
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
