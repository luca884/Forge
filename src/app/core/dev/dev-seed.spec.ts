import { ForgeDatabase } from '@core/db/database';
import { seedDemoData } from './dev-seed';

describe('seedDemoData', () => {
  let db: ForgeDatabase;

  beforeEach(async () => {
    db = new ForgeDatabase();
    // Clear each table so state does not leak between tests.
    // Dexie opens lazily on first table access; no explicit db.open() needed.
    await db.profile.clear();
    await db.exercises.clear();
    await db.routines.clear();
    await db.trainingDays.clear();
    await db.sessions.clear();
    await db.workedSets.clear();
    await db.personalRecords.clear();
  });

  afterEach(() => {
    db.close();
  });

  it('should seed 5 exercises', async () => {
    await seedDemoData(db);
    expect(await db.exercises.count()).toBe(5);
  });

  it('should seed 1 routine and it should be active with the expected schedule', async () => {
    await seedDemoData(db);
    expect(await db.routines.count()).toBe(1);
    const routine = await db.routines.get('r-1');
    expect(routine).toBeDefined();
    expect(routine!.isActive).toBe(true);
    expect(routine!.schedule).toEqual({
      monday: 'd-push',
      wednesday: 'd-pull',
      friday: 'd-push',
    });
  });

  it('should seed 2 training days', async () => {
    await seedDemoData(db);
    expect(await db.trainingDays.count()).toBe(2);
  });

  it('should seed 2 sessions', async () => {
    await seedDemoData(db);
    expect(await db.sessions.count()).toBe(2);
  });

  it('should seed 6 worked sets', async () => {
    await seedDemoData(db);
    expect(await db.workedSets.count()).toBe(6);
  });

  it('should seed 5 personal records', async () => {
    await seedDemoData(db);
    expect(await db.personalRecords.count()).toBe(5);
  });

  it('should seed profile with name Luca', async () => {
    await seedDemoData(db);
    const profile = await db.profile.get('me');
    expect(profile).toBeDefined();
    expect(profile!.name).toBe('Luca');
  });

  it('should be idempotent — calling twice yields the same counts', async () => {
    await seedDemoData(db);
    await seedDemoData(db);
    expect(await db.exercises.count()).toBe(5);
    expect(await db.routines.count()).toBe(1);
    expect(await db.trainingDays.count()).toBe(2);
    expect(await db.sessions.count()).toBe(2);
    expect(await db.workedSets.count()).toBe(6);
    expect(await db.personalRecords.count()).toBe(5);
    const profile = await db.profile.get('me');
    expect(profile!.name).toBe('Luca');
  });
});
