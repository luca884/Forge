import { DomainError } from '../errors/domain-error';

/**
 * Forge backup file: every table of the local database, as JSON.
 *
 * The file format is a persisted contract: a backup written today must still restore after the app
 * changes. Bump BACKUP_VERSION when the shape of `data` changes, and teach parseBackup to read the
 * older versions it replaces.
 */
export const BACKUP_FORMAT = 'forge-backup';
export const BACKUP_VERSION = 1;

/** Tables in the backup, named as the database names them. */
export const BACKUP_TABLES = [
  'profile',
  'routines',
  'trainingDays',
  'exercises',
  'sessions',
  'workedSets',
  'personalRecords',
  'auditEvents',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

/** A stored row: an object with a string id. Rows travel as stored; the codec only revives dates. */
export type BackupRow = Readonly<Record<string, unknown>> & { readonly id: string };

export type BackupData = Readonly<Record<BackupTable, readonly BackupRow[]>>;

export interface Backup {
  readonly exportedAt: Date;
  readonly data: BackupData;
}

/**
 * Fields stored as Date in each table. JSON turns them into ISO strings; parseBackup turns them back.
 * `optional` dates may be missing (a session in progress has no endedAt).
 */
interface DateFields {
  readonly required: readonly string[];
  readonly optional?: readonly string[];
}

const DATE_FIELDS: Readonly<Record<BackupTable, DateFields>> = {
  profile: { required: ['createdAt', 'updatedAt'] },
  routines: { required: ['createdAt', 'updatedAt'] },
  trainingDays: { required: ['createdAt', 'updatedAt'] },
  exercises: { required: ['createdAt', 'updatedAt'] },
  sessions: { required: ['startedAt', 'createdAt', 'updatedAt'], optional: ['endedAt'] },
  workedSets: { required: ['createdAt'] },
  personalRecords: { required: ['achievedAt', 'createdAt', 'updatedAt'] },
  auditEvents: { required: ['occurredAt'] },
};

const INVALID_MESSAGE = 'El archivo no es un respaldo de Forge válido.';
const NEWER_MESSAGE = 'Este respaldo es de una versión más nueva de Forge. Actualizá la app y probá de nuevo.';

/** The file cannot be restored. Its message is meant for the user. */
export class InvalidBackupError extends DomainError {
  constructor(message: string = INVALID_MESSAGE) {
    super(message, 'InvalidBackupError');
  }
}

export function serializeBackup(backup: Backup): string {
  // Dates serialize themselves as ISO strings (Date#toJSON).
  return JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: backup.exportedAt, data: backup.data });
}

/** Reads a backup file. Throws InvalidBackupError, without partial results, when anything is off. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new InvalidBackupError();
  }
  if (!isObject(raw) || raw['format'] !== BACKUP_FORMAT || typeof raw['version'] !== 'number') {
    throw new InvalidBackupError();
  }
  if (raw['version'] > BACKUP_VERSION) throw new InvalidBackupError(NEWER_MESSAGE);
  if (raw['version'] !== BACKUP_VERSION) throw new InvalidBackupError();

  const rawData = raw['data'];
  if (!isObject(rawData)) throw new InvalidBackupError();

  const data = Object.fromEntries(
    BACKUP_TABLES.map((table) => {
      const rows = rawData[table];
      if (!Array.isArray(rows)) throw new InvalidBackupError();
      return [table, rows.map((row) => reviveRow(row, table))];
    }),
  ) as unknown as BackupData;

  return { exportedAt: toDate(raw['exportedAt']), data };
}

function reviveRow(row: unknown, table: BackupTable): BackupRow {
  if (!isObject(row) || typeof row['id'] !== 'string' || row['id'] === '') throw new InvalidBackupError();
  const revived: Record<string, unknown> = { ...row };
  const { required, optional = [] } = DATE_FIELDS[table];
  for (const field of required) revived[field] = toDate(row[field]);
  for (const field of optional) {
    if (field in row && row[field] !== undefined) revived[field] = toDate(row[field]);
  }
  return revived as BackupRow;
}

function toDate(value: unknown): Date {
  if (typeof value !== 'string') throw new InvalidBackupError();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new InvalidBackupError();
  return date;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
