import { Injectable, inject } from '@angular/core';
import { BackupStore } from '../backup/backup-store';
import { parseBackup, serializeBackup, type Backup } from '../backup/backup';

/** "Exportar respaldo": every table of the database, as the text of a backup file. */
@Injectable()
export class ExportBackupUseCase {
  private readonly store = inject(BackupStore);

  async execute(): Promise<string> {
    return serializeBackup({ exportedAt: new Date(), data: await this.store.readAll() });
  }
}

/** "Restaurar respaldo": read (and validate) a file first, then replace every table with it. */
@Injectable()
export class RestoreBackupUseCase {
  private readonly store = inject(BackupStore);

  /** Throws InvalidBackupError, with a message for the user, when the file cannot be restored. */
  read(text: string): Backup {
    return parseBackup(text);
  }

  /** Deletes the current data and leaves exactly the backup's. All or nothing. */
  execute(backup: Backup): Promise<void> {
    return this.store.replaceAll(backup.data);
  }
}
