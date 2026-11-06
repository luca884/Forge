/**
 * DexieBackupStore against a real database (fake-indexeddb, registered in setup-jest.ts).
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { BACKUP_TABLES, parseBackup, serializeBackup, type BackupData } from '../domain/backup/backup';
import { DexieBackupStore } from './dexie-backup-store';

const d = (iso: string) => new Date(iso);

/** One row per table; `tag` makes ids and names distinct between data sets. */
function dataSet(tag: string): BackupData {
  const at = d('2026-11-03T18:00:00Z');
  return {
    profile: [{ id: 'me', name: `Perfil ${tag}`, preferredUnit: 'kg', createdAt: at, updatedAt: at }],
    routines: [{ id: `rt-${tag}`, name: `Rutina ${tag}`, isActive: true, schedule: null, createdAt: at, updatedAt: at }],
    trainingDays: [{ id: `day-${tag}`, routineId: `rt-${tag}`, name: `Día ${tag}`, exercises: [], createdAt: at, updatedAt: at }],
    exercises: [{ id: `ex-${tag}`, name: `Ejercicio ${tag}`, muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: true, createdAt: at, updatedAt: at }],
    sessions: [{ id: `s-${tag}`, routineId: `rt-${tag}`, dayId: `day-${tag}`, date: '2026-11-03', startedAt: at, status: 'in-progress', createdAt: at, updatedAt: at }],
    workedSets: [{ id: `ws-${tag}`, sessionId: `s-${tag}`, exerciseId: `ex-${tag}`, type: 'weight-reps', isPR: false, reps: 5, weightKg: 60, createdAt: at }],
    personalRecords: [{ id: `pr-${tag}`, exerciseId: `ex-${tag}`, trackingType: 'weight-reps', workedSetId: `ws-${tag}`, achievedAt: at, reps: 5, weightKg: 60, createdAt: at, updatedAt: at }],
    auditEvents: [{ id: `ae-${tag}`, name: 'WorkedSetEdited', occurredAt: at, payload: '{}' }],
  };
}

describe('DexieBackupStore', () => {
  let db: ForgeDatabaseService;
  let store: DexieBackupStore;

  async function seed(data: BackupData): Promise<void> {
    for (const table of BACKUP_TABLES) await db.table(table).bulkAdd([...data[table]]);
  }

  async function contents(): Promise<Record<string, unknown[]>> {
    return Object.fromEntries(await Promise.all(BACKUP_TABLES.map(async (t) => [t, await db.table(t).toArray()])));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [ForgeDatabaseService, DexieBackupStore] });
    db = TestBed.inject(ForgeDatabaseService);
    store = TestBed.inject(DexieBackupStore);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('readAll returns every row of every table', async () => {
    await seed(dataSet('a'));
    expect(await store.readAll()).toEqual(dataSet('a'));
  });

  it('replaceAll leaves exactly the given rows: the previous ones are gone', async () => {
    await seed(dataSet('old'));
    await store.replaceAll(dataSet('new'));
    expect(await contents()).toEqual(dataSet('new'));
  });

  it('replaceAll is all or nothing: when a row cannot be written, the previous data stays', async () => {
    await seed(dataSet('old'));
    const broken = dataSet('new');
    // Two workedSets with the same id: the second insert fails after the clears already ran.
    const withDuplicate: BackupData = { ...broken, workedSets: [...broken.workedSets, ...broken.workedSets] };

    await expect(store.replaceAll(withDuplicate)).rejects.toThrow();
    expect(await contents()).toEqual(dataSet('old'));
  });

  it('a backup written from the database restores the same database', async () => {
    await seed(dataSet('a'));
    const file = serializeBackup({ exportedAt: new Date(), data: await store.readAll() });
    await store.replaceAll(dataSet('other'));

    await store.replaceAll(parseBackup(file).data);
    expect(await contents()).toEqual(dataSet('a'));
  });
});
