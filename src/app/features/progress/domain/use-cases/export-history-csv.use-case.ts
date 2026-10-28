import { Injectable, inject } from '@angular/core';
import { Session } from '@features/training/domain/session.entity';
import { SessionRepository } from '@features/training/domain/session.repository';
import { WorkedSet } from '@features/training/domain/worked-set';
import { RoutineRepository } from '@features/routines/domain/routine.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

/** Columns agreed in D2 (odd/tasks/rediseno-cuaderno.md, L20). */
export const HISTORY_CSV_HEADER: readonly string[] = [
  'fecha', 'rutina', 'dia', 'ejercicio', 'serie', 'tipo', 'peso', 'unidad', 'reps', 'tiempo_s', 'distancia_km', 'pr',
];

export interface HistoryCsv {
  /** CSV text with CRLF line endings, without the BOM (the download adds it). */
  readonly content: string;
  /** Data rows, header excluded. */
  readonly rowCount: number;
}

const SET_TYPE_LABEL: Record<WorkedSet['type'], string> = {
  'weight-reps': 'peso_reps',
  'bodyweight-reps': 'peso_corporal',
  time: 'tiempo',
  'distance-time': 'distancia_tiempo',
};

/** Same conversion and rounding as DisplayWeightPipe, so the file matches what the app shows. */
const KG_TO_LB = 2.20462;

/**
 * Builds "Exportar historial (CSV)" from Perfil: one row per set of every
 * completed session, oldest session first and sets in the order they were
 * logged. Read-only: it never writes data.
 */
@Injectable()
export class ExportHistoryCsvUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly routineRepo = inject(RoutineRepository);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute(unit: PreferredUnit): Promise<HistoryCsv> {
    const [sessions, sets, routines, exercises] = await Promise.all([
      this.sessionRepo.getAllSessions(),
      // Every set ever logged: the epoch is the lower bound of the date window.
      this.sessionRepo.getWorkedSetsSince(new Date(0)),
      this.routineRepo.getAll(),
      this.exerciseRepo.getAll(),
    ]);

    const completed = sessions
      .filter((session) => session.status === 'completed')
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const routineNames = new Map(routines.map((routine) => [routine.id, routine.name]));
    const exerciseNames = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
    const dayNames = await this.dayNames(completed);
    const setsBySession = groupBySession(sets);

    const rows: string[][] = [];
    for (const session of completed) {
      const setNumber = new Map<string, number>();
      for (const set of setsBySession.get(session.id) ?? []) {
        const serie = (setNumber.get(set.exerciseId) ?? 0) + 1;
        setNumber.set(set.exerciseId, serie);
        rows.push([
          session.date,
          routineNames.get(session.routineId) ?? '',
          dayNames.get(session.dayId) ?? '',
          exerciseNames.get(set.exerciseId) ?? '',
          String(serie),
          SET_TYPE_LABEL[set.type],
          ...measures(set, unit),
          set.isPR ? 'sí' : 'no',
        ]);
      }
    }

    const content = [HISTORY_CSV_HEADER, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';
    return { content, rowCount: rows.length };
  }

  private async dayNames(sessions: readonly Session[]): Promise<Map<string, string>> {
    const ids = [...new Set(sessions.map((session) => session.dayId))];
    const days = await Promise.all(ids.map((id) => this.trainingDayRepo.getById(id)));
    return new Map(days.filter((day) => day !== null).map((day) => [day.id, day.name]));
  }
}

function groupBySession(sets: readonly WorkedSet[]): Map<string, WorkedSet[]> {
  const ordered = [...sets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const bySession = new Map<string, WorkedSet[]>();
  for (const set of ordered) {
    const list = bySession.get(set.sessionId);
    if (list) list.push(set);
    else bySession.set(set.sessionId, [set]);
  }
  return bySession;
}

/** peso, unidad, reps, tiempo_s, distancia_km — empty when the cell does not apply to the set type. */
function measures(set: WorkedSet, unit: PreferredUnit): [string, string, string, string, string] {
  switch (set.type) {
    case 'weight-reps':
      return [formatWeight(set.weight.value, unit), unit, String(set.reps.value), '', ''];
    case 'bodyweight-reps':
      return set.extraWeight
        ? [formatWeight(set.extraWeight.value, unit), unit, String(set.reps.value), '', '']
        : ['', '', String(set.reps.value), '', ''];
    case 'time':
      return ['', '', '', String(set.durationSec), ''];
    case 'distance-time':
      return ['', '', '', String(set.durationSec), String(set.distanceKm)];
  }
}

function formatWeight(kg: number, unit: PreferredUnit): string {
  return unit === 'lb' ? (kg * KG_TO_LB).toFixed(1) : String(kg);
}

/** RFC 4180: quote cells with commas, quotes or line breaks, doubling inner quotes. */
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
