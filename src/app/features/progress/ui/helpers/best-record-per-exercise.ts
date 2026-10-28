/**
 * Rows of the "Récords personales" table: one per exercise, with its best mark,
 * ordered by the most recent record of each exercise (newest first).
 *
 * PR rows are append-only, so an exercise that improved five times has five rows;
 * listing them as they come would let one lift fill the whole table. The best mark
 * follows the same rule as the history tiles (heaviest set, then more reps); on a
 * perfect tie the most recent record wins.
 * Pure UI helper — no Angular DI.
 */
import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { compareBestSet } from './best-set';

interface ExerciseRecords {
  best: PersonalRecord;
  latest: Date;
}

export function bestRecordPerExercise(records: readonly PersonalRecord[]): PersonalRecord[] {
  const byExercise = new Map<string, ExerciseRecords>();
  for (const record of records) {
    const group = byExercise.get(record.exerciseId);
    if (!group) {
      byExercise.set(record.exerciseId, { best: record, latest: record.achievedAt });
      continue;
    }
    const order = compareBestSet(record.set, group.best.set);
    if (order > 0 || (order === 0 && record.achievedAt > group.best.achievedAt)) group.best = record;
    if (record.achievedAt > group.latest) group.latest = record.achievedAt;
  }
  return [...byExercise.values()].sort((a, b) => b.latest.getTime() - a.latest.getTime()).map((g) => g.best);
}
