import { BACKUP_TABLES, InvalidBackupError, parseBackup, serializeBackup, type Backup } from './backup';

const d = (iso: string) => new Date(iso);

/** One row per table, with every date field the codec revives. */
function sampleBackup(): Backup {
  return {
    exportedAt: d('2026-11-05T21:30:00.000Z'),
    data: {
      profile: [{ id: 'me', name: 'Luca', preferredUnit: 'kg', createdAt: d('2026-01-01T10:00:00Z'), updatedAt: d('2026-02-01T10:00:00Z') }],
      routines: [{ id: 'rt-1', name: 'Torso / Pierna', isActive: true, schedule: { monday: 'day-1' }, createdAt: d('2026-01-02T10:00:00Z'), updatedAt: d('2026-01-03T10:00:00Z') }],
      trainingDays: [
        {
          id: 'day-1',
          routineId: 'rt-1',
          name: 'Torso A',
          label: 'A',
          exercises: [{ exerciseId: 'ex-1', order: 0, targetSets: [{ type: 'weight-reps', reps: 5, weightKg: 60 }], restSeconds: 120 }],
          createdAt: d('2026-01-02T10:00:00Z'),
          updatedAt: d('2026-01-02T11:00:00Z'),
        },
      ],
      exercises: [{ id: 'ex-1', name: 'Press banca', muscleGroup: 'chest', trackingType: 'weight-reps', isCustom: false, createdAt: d('2026-01-01T00:00:00Z'), updatedAt: d('2026-01-01T00:00:00Z') }],
      sessions: [
        { id: 's-1', routineId: 'rt-1', dayId: 'day-1', date: '2026-11-03', startedAt: d('2026-11-03T18:00:00Z'), endedAt: d('2026-11-03T19:00:00Z'), status: 'completed', createdAt: d('2026-11-03T18:00:00Z'), updatedAt: d('2026-11-03T19:00:00Z') },
        // In progress: no endedAt.
        { id: 's-2', routineId: 'rt-1', dayId: 'day-1', date: '2026-11-05', startedAt: d('2026-11-05T18:00:00Z'), status: 'in-progress', createdAt: d('2026-11-05T18:00:00Z'), updatedAt: d('2026-11-05T18:00:00Z') },
      ],
      workedSets: [{ id: 'ws-1', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps', isPR: true, reps: 5, weightKg: 62.5, createdAt: d('2026-11-03T18:10:00Z') }],
      personalRecords: [{ id: 'pr-1', exerciseId: 'ex-1', trackingType: 'weight-reps', workedSetId: 'ws-1', achievedAt: d('2026-11-03T18:10:00Z'), reps: 5, weightKg: 62.5, createdAt: d('2026-11-03T18:10:00Z'), updatedAt: d('2026-11-03T18:10:00Z') }],
      auditEvents: [{ id: 'ae-1', name: 'WorkedSetEdited', occurredAt: d('2026-11-03T18:20:00Z'), sessionId: 's-1', payload: '{"setId":"ws-1"}' }],
    },
  };
}

/** A valid serialized backup, edited by `mutate` before going back to text. */
function tampered(mutate: (raw: Record<string, any>) => void): string {
  const raw = JSON.parse(serializeBackup(sampleBackup()));
  mutate(raw);
  return JSON.stringify(raw);
}

describe('backup codec', () => {
  it('round-trips every table, dates included', () => {
    const backup = sampleBackup();
    const parsed = parseBackup(serializeBackup(backup));
    expect(parsed).toEqual(backup);
    expect(parsed.data.sessions[0]['startedAt']).toBeInstanceOf(Date);
    expect(Object.keys(parsed.data).sort()).toEqual([...BACKUP_TABLES].sort());
  });

  it('marks the file as a Forge backup, version 1', () => {
    const raw = JSON.parse(serializeBackup(sampleBackup()));
    expect(raw.format).toBe('forge-backup');
    expect(raw.version).toBe(1);
    expect(raw.exportedAt).toBe('2026-11-05T21:30:00.000Z');
  });

  it.each<[string, string]>([
    ['not JSON', 'esto no es json'],
    ['not an object', '[]'],
    ['another format', tampered((r) => (r.format = 'otra-app'))],
    ['no version', tampered((r) => delete r.version)],
    ['a missing table', tampered((r) => delete r.data.sessions)],
    ['a table that is not a list', tampered((r) => (r.data.routines = {}))],
    ['a row that is not an object', tampered((r) => r.data.exercises.push('x'))],
    ['a row without id', tampered((r) => delete r.data.routines[0].id)],
    ['a row with an empty id', tampered((r) => (r.data.workedSets[0].id = ''))],
    ['a missing required date', tampered((r) => delete r.data.sessions[0].startedAt)],
    ['an invalid date', tampered((r) => (r.data.personalRecords[0].achievedAt = 'ayer'))],
    ['an invalid optional date', tampered((r) => (r.data.sessions[0].endedAt = 42))],
    ['an invalid export date', tampered((r) => (r.exportedAt = 'nunca'))],
    ['a missing export date', tampered((r) => delete r.exportedAt)],
    ['a null optional date', tampered((r) => (r.data.sessions[0].endedAt = null))],
    ['version 0', tampered((r) => (r.version = 0))],
    ['version as text', tampered((r) => (r.version = '1'))],
    ['an empty file', ''],
    ['a byte order mark before the JSON', '﻿' + serializeBackup(sampleBackup())],
  ])('rejects %s', (_case, text) => {
    expect(() => parseBackup(text)).toThrow(InvalidBackupError);
    expect(() => parseBackup(text)).toThrow('El archivo no es un respaldo de Forge válido.');
  });

  it('ignores tables it does not know', () => {
    const parsed = parseBackup(tampered((r) => (r.data.otraTabla = [{ id: 'x' }])));
    expect(Object.keys(parsed.data).sort()).toEqual([...BACKUP_TABLES].sort());
  });

  it('rejects a backup from a newer version of Forge with its own message', () => {
    const text = tampered((r) => (r.version = 2));
    expect(() => parseBackup(text)).toThrow(InvalidBackupError);
    expect(() => parseBackup(text)).toThrow('Este respaldo es de una versión más nueva de Forge. Actualizá la app y probá de nuevo.');
  });
});
