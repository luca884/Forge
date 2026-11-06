import { TestBed } from '@angular/core/testing';
import { BackupStore } from '../backup/backup-store';
import { InvalidBackupError, parseBackup, serializeBackup, type BackupData } from '../backup/backup';
import { ExportBackupUseCase, RestoreBackupUseCase } from './backup.use-cases';

const at = new Date('2026-11-03T18:00:00Z');
const data: BackupData = {
  profile: [{ id: 'me', name: 'Luca', createdAt: at, updatedAt: at }],
  routines: [],
  trainingDays: [],
  exercises: [{ id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps', isCustom: false, createdAt: at, updatedAt: at }],
  sessions: [],
  workedSets: [],
  personalRecords: [],
  auditEvents: [],
};

describe('backup use cases', () => {
  const store = { readAll: jest.fn(), replaceAll: jest.fn() };

  beforeEach(() => {
    store.readAll.mockReset().mockResolvedValue(data);
    store.replaceAll.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [ExportBackupUseCase, RestoreBackupUseCase, { provide: BackupStore, useValue: store }],
    });
  });

  it('export writes every table as a backup file, stamped with the current time', async () => {
    const before = Date.now();
    const file = await TestBed.inject(ExportBackupUseCase).execute();
    const backup = parseBackup(file);
    expect(backup.data).toEqual(data);
    expect(backup.exportedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(backup.exportedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('read validates a file without touching the data', () => {
    const useCase = TestBed.inject(RestoreBackupUseCase);
    const text = serializeBackup({ exportedAt: at, data });
    expect(useCase.read(text)).toEqual({ exportedAt: at, data });
    expect(() => useCase.read('{}')).toThrow(InvalidBackupError);
    expect(store.replaceAll).not.toHaveBeenCalled();
  });

  it('restore replaces every table with the backup', async () => {
    await TestBed.inject(RestoreBackupUseCase).execute({ exportedAt: at, data });
    expect(store.replaceAll).toHaveBeenCalledWith(data);
  });
});
