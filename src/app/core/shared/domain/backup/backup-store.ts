import type { BackupData } from './backup';

/** Reads and replaces every table of the local database at once. */
export abstract class BackupStore {
  abstract readAll(): Promise<BackupData>;

  /** Deletes every current row and writes the given ones. All or nothing: on failure, nothing changes. */
  abstract replaceAll(data: BackupData): Promise<void>;
}
