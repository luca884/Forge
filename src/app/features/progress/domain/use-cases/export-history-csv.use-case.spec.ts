import { TestBed } from '@angular/core/testing';
import { ExportHistoryCsvUseCase, HISTORY_CSV_HEADER } from './export-history-csv.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { Session } from '@features/training/domain/session.entity';
import { WorkedSet } from '@features/training/domain/worked-set';
import { RoutineRepository } from '@features/routines/domain/routine.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

function makeSession(id: string, overrides: Partial<Session> = {}): Session {
  const startedAt = overrides.startedAt ?? new Date('2026-03-02T10:00:00');
  return {
    id,
    routineId: 'rt-1',
    dayId: 'day-a',
    date: '2026-03-02',
    startedAt,
    endedAt: new Date(startedAt.getTime() + 3_600_000),
    status: 'completed',
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  };
}

let clock = 0;
function at(): Date {
  clock += 1;
  return new Date(Date.UTC(2026, 2, 2, 10, 0, clock));
}

function weightReps(sessionId: string, exerciseId: string, kg: number, reps: number, isPR = false): WorkedSet {
  return {
    id: `set-${clock + 1}`,
    sessionId,
    exerciseId,
    type: 'weight-reps',
    weight: new Weight(kg),
    reps: new Reps(reps),
    isPR,
    createdAt: at(),
  };
}

interface Stubs {
  sessions: Session[];
  sets: WorkedSet[];
  routines: { id: string; name: string }[];
  days: { id: string; name: string }[];
  exercises: { id: string; name: string; weightUnit?: 'kg' | 'plates' }[];
}

function setup(stubs: Partial<Stubs> = {}): { useCase: ExportHistoryCsvUseCase; getWorkedSetsSince: jest.Mock } {
  const data: Stubs = {
    sessions: [],
    sets: [],
    routines: [{ id: 'rt-1', name: 'Torso / Pierna' }],
    days: [{ id: 'day-a', name: 'Pierna A' }],
    exercises: [
      { id: 'ex-squat', name: 'Sentadilla' },
      { id: 'ex-pull', name: 'Dominadas' },
      { id: 'ex-plank', name: 'Plancha' },
      { id: 'ex-run', name: 'Correr' },
    ],
    ...stubs,
  };
  const getWorkedSetsSince = jest.fn().mockResolvedValue(data.sets);

  TestBed.configureTestingModule({
    providers: [
      ExportHistoryCsvUseCase,
      {
        provide: SessionRepository,
        useValue: { getAllSessions: jest.fn().mockResolvedValue(data.sessions), getWorkedSetsSince },
      },
      { provide: RoutineRepository, useValue: { getAll: jest.fn().mockResolvedValue(data.routines) } },
      {
        provide: TrainingDayRepository,
        useValue: {
          getById: jest.fn((id: string) => Promise.resolve(data.days.find((d) => d.id === id) ?? null)),
        },
      },
      { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue(data.exercises) } },
    ],
  });
  return { useCase: TestBed.inject(ExportHistoryCsvUseCase), getWorkedSetsSince };
}

function lines(content: string): string[] {
  return content.split('\r\n');
}

describe('ExportHistoryCsvUseCase', () => {
  beforeEach(() => {
    clock = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts with the D2 header and ends every line with CRLF', async () => {
    const { useCase } = setup();

    const { content, rowCount } = await useCase.execute('kg');

    expect(HISTORY_CSV_HEADER).toEqual([
      'fecha', 'rutina', 'dia', 'ejercicio', 'serie', 'tipo', 'peso', 'unidad', 'reps', 'tiempo_s', 'distancia_km', 'pr',
    ]);
    expect(content).toBe('fecha,rutina,dia,ejercicio,serie,tipo,peso,unidad,reps,tiempo_s,distancia_km,pr\r\n');
    expect(rowCount).toBe(0);
  });

  it('reads every set ever logged, not a recent window', async () => {
    const { useCase, getWorkedSetsSince } = setup();

    await useCase.execute('kg');

    expect(getWorkedSetsSince).toHaveBeenCalledWith(new Date(0));
  });

  it('writes one row per weight-reps set, numbering sets per exercise and marking PRs', async () => {
    const session = makeSession('s-1');
    const sets = [
      weightReps('s-1', 'ex-squat', 100, 5),
      weightReps('s-1', 'ex-squat', 102.5, 5, true),
      weightReps('s-1', 'ex-pull', 10, 8),
    ];
    const { useCase } = setup({ sessions: [session], sets });

    const { content, rowCount } = await useCase.execute('kg');

    expect(rowCount).toBe(3);
    expect(lines(content).slice(1, 4)).toEqual([
      '2026-03-02,Torso / Pierna,Pierna A,Sentadilla,1,peso_reps,100,kg,5,,,no',
      '2026-03-02,Torso / Pierna,Pierna A,Sentadilla,2,peso_reps,102.5,kg,5,,,sí',
      '2026-03-02,Torso / Pierna,Pierna A,Dominadas,1,peso_reps,10,kg,8,,,no',
    ]);
  });

  it('converts weights to lb with one decimal, like the rest of the app', async () => {
    const { useCase } = setup({ sessions: [makeSession('s-1')], sets: [weightReps('s-1', 'ex-squat', 100, 5)] });

    const { content } = await useCase.execute('lb');

    expect(lines(content)[1]).toBe('2026-03-02,Torso / Pierna,Pierna A,Sentadilla,1,peso_reps,220.5,lb,5,,,no');
  });

  // D4: the stored number of a plates exercise is plates, so the file says "placas" and never converts it.
  it('writes a plates set as plates with the unit "placas", whatever the preferred unit', async () => {
    const { useCase } = setup({
      sessions: [makeSession('s-1')],
      sets: [weightReps('s-1', 'ex-press', 7, 5)],
      exercises: [{ id: 'ex-press', name: 'Prensa', weightUnit: 'plates' }],
    });

    const { content } = await useCase.execute('lb');

    expect(lines(content)[1]).toBe('2026-03-02,Torso / Pierna,Pierna A,Prensa,1,peso_reps,7,placas,5,,,no');
  });

  it('writes bodyweight, time and distance sets with only the cells that apply', async () => {
    const sets: WorkedSet[] = [
      { id: 'b1', sessionId: 's-1', exerciseId: 'ex-pull', type: 'bodyweight-reps', reps: new Reps(12), isPR: false, createdAt: at() },
      {
        id: 'b2', sessionId: 's-1', exerciseId: 'ex-pull', type: 'bodyweight-reps', reps: new Reps(6),
        extraWeight: new Weight(20), isPR: false, createdAt: at(),
      },
      { id: 't1', sessionId: 's-1', exerciseId: 'ex-plank', type: 'time', durationSec: 90, isPR: true, createdAt: at() },
      {
        id: 'd1', sessionId: 's-1', exerciseId: 'ex-run', type: 'distance-time', distanceKm: 5.2, durationSec: 1800,
        isPR: false, createdAt: at(),
      },
    ];
    const { useCase } = setup({ sessions: [makeSession('s-1')], sets });

    const { content } = await useCase.execute('kg');

    expect(lines(content).slice(1, 5)).toEqual([
      '2026-03-02,Torso / Pierna,Pierna A,Dominadas,1,peso_corporal,,,12,,,no',
      '2026-03-02,Torso / Pierna,Pierna A,Dominadas,2,peso_corporal,20,kg,6,,,no',
      '2026-03-02,Torso / Pierna,Pierna A,Plancha,1,tiempo,,,,90,,sí',
      '2026-03-02,Torso / Pierna,Pierna A,Correr,1,distancia_tiempo,,,,1800,5.2,no',
    ]);
  });

  it('leaves out sessions that are not completed, and their sets', async () => {
    const sessions = [makeSession('s-done'), makeSession('s-open', { status: 'in-progress' })];
    const sets = [weightReps('s-open', 'ex-squat', 60, 10), weightReps('s-done', 'ex-squat', 80, 5)];
    const { useCase } = setup({ sessions, sets });

    const { content, rowCount } = await useCase.execute('kg');

    expect(rowCount).toBe(1);
    expect(lines(content)[1]).toContain(',80,kg,5,');
  });

  it('orders rows by session start, oldest first, then by logging order', async () => {
    const older = makeSession('s-old', { date: '2025-11-20', startedAt: new Date('2025-11-20T09:00:00') });
    const newer = makeSession('s-new', { date: '2026-03-02', startedAt: new Date('2026-03-02T10:00:00') });
    // Logged out of order on purpose: the newer session's set comes first in storage.
    const sets = [weightReps('s-new', 'ex-squat', 100, 5), weightReps('s-old', 'ex-squat', 90, 5)];
    const { useCase } = setup({ sessions: [newer, older], sets });

    const { content } = await useCase.execute('kg');

    expect(lines(content)[1]).toMatch(/^2025-11-20,/);
    expect(lines(content)[2]).toMatch(/^2026-03-02,/);
  });

  it('quotes names with commas, quotes or line breaks', async () => {
    const { useCase } = setup({
      sessions: [makeSession('s-1')],
      sets: [weightReps('s-1', 'ex-x', 50, 10)],
      routines: [{ id: 'rt-1', name: 'Fuerza, fase "A"' }],
      days: [{ id: 'day-a', name: 'Día\nlargo' }],
      exercises: [{ id: 'ex-x', name: 'Press "inclinado"' }],
    });

    const { content } = await useCase.execute('kg');

    expect(content).toContain('2026-03-02,"Fuerza, fase ""A""","Día\nlargo","Press ""inclinado""",1,peso_reps,50,kg,10,,,no\r\n');
  });

  it('keeps sets whose routine, day or exercise no longer exists, with empty names', async () => {
    const { useCase } = setup({
      sessions: [makeSession('s-1', { routineId: 'rt-gone', dayId: 'day-gone' })],
      sets: [weightReps('s-1', 'ex-gone', 70, 6)],
    });

    const { content, rowCount } = await useCase.execute('kg');

    expect(rowCount).toBe(1);
    expect(lines(content)[1]).toBe('2026-03-02,,,,1,peso_reps,70,kg,6,,,no');
  });
});
