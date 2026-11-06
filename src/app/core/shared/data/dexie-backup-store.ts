import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { BACKUP_TABLES, type BackupData, type BackupRow } from '../domain/backup/backup';
import { BackupStore } from '../domain/backup/backup-store';

@Injectable()
export class DexieBackupStore extends BackupStore {
  private readonly db = inject(ForgeDatabaseService);

  async readAll(): Promise<BackupData> {
    const tables = BACKUP_TABLES.map((name) => this.db.table<BackupRow, string>(name));
    // One read transaction: the backup is a consistent snapshot even if the app writes meanwhile.
    return this.db.transaction('r', tables, async () => {
      const rows = await Promise.all(tables.map((table) => table.toArray()));
      return Object.fromEntries(BACKUP_TABLES.map((name, i) => [name, rows[i]])) as unknown as BackupData;
    });
  }

  async replaceAll(data: BackupData): Promise<void> {
    const tables = BACKUP_TABLES.map((name) => this.db.table<BackupRow, string>(name));
    // A failed write aborts the transaction, and IndexedDB rolls back the clears with it.
    // Chained Dexie promises, not sequential awaits: a native await inside the callback can lose
    // Dexie's transaction zone (zone.js) and end in PrematureCommitError.
    await this.db.transaction('rw', tables, () =>
      Promise.all(tables.map((table) => table.clear())).then(() =>
        Promise.all(BACKUP_TABLES.map((name) => this.db.table<BackupRow, string>(name).bulkAdd([...data[name]]))),
      ),
    );
  }
}
