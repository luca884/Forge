/**
 * CorrectPastSetUseCase against the real Dexie repositories (fake-indexeddb, setup-jest.ts).
 * Spec: odd/tasks/sesiones-pasadas.md S2–S4.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import type { Reps } from '@core/shared/domain/value-objects/reps';
import type { Weight } from '@core/shared/domain/value-objects/weight';
import type { PersonalRecordRow } from '@core/db/database';
import { SessionRepository } from '../session.repository';
import { DexieSessionRepository } from '../../data/dexie-session.repository';
import { toSessionRow } from '../../data/session.mapper';
import { toWorkedSetRow } from '../../data/worked-set.mapper';
import { ExerciseHistoryStore } from '../exercise-history.store';
import { DexieExerciseHistoryStore } from '../../data/dexie-exercise-history.store';
import { PersonalRecordDetector } from '../services/personal-record-detector';
import { ExerciseRecordsRebuilder } from '../services/exercise-records-rebuilder';
import type { Session } from '../session.entity';
import type { WeightRepsSet } from '../worked-set';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { SessionStillInProgressError } from '../errors/session-still-in-progress.error';
import { CorrectPastSetUseCase } from './correct-past-set.use-case';

const at = (day: number, minute = 0) => new Date(Date.UTC(2026, 10, day, 18, minute));

function session(id: string, day: number, status: Session['status'] = 'completed'): Session {
  return { id, routineId: 'rt-1', dayId: 'day-1', date: `2026-11-0${day}`, startedAt: at(day), endedAt: at(day, 50), status, createdAt: at(day), updatedAt: at(day) } as Session;
}

function lift(id: string, sessionId: string, createdAt: Date, weight: number, reps: number, isPR: boolean, exerciseId = 'ex-1'): WeightRepsSet {
  return { id, sessionId, exerciseId, type: 'weight-reps', isPR, createdAt, reps: { value: reps } as Reps, weight: { value: weight } as Weight };
}

function prRow(id: string, set: WeightRepsSet): PersonalRecordRow {
  return { id, exerciseId: set.exerciseId, trackingType: 'weight-reps', workedSetId: set.id, achievedAt: set.createdAt, reps: set.reps.value, weightKg: set.weight.value, createdAt: set.createdAt, updatedAt: set.createdAt };
}

describe('CorrectPastSetUseCase', () => {
  let db: ForgeDatabaseService;
  let useCase: CorrectPastSetUseCase;
  let events: string[];

  // Day 1: 60x5 (record). Day 2: 70x5 (record). Another exercise on day 1, untouched by corrections.
  const a = lift('a', 's1', at(1, 5), 60, 5, true);
  const b = lift('b', 's2', at(2, 5), 70, 5, true);
  const other = lift('o', 's1', at(1, 10), 100, 3, true, 'ex-2');

  beforeEach(async () => {
    // crypto.randomUUID is not available in jsdom: rebuilt records need ids.
    let uuid = 0;
    Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => `uuid-${++uuid}` }, writable: true });
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        CorrectPastSetUseCase,
        ExerciseRecordsRebuilder,
        PersonalRecordDetector,
        { provide: SessionRepository, useClass: DexieSessionRepository },
        { provide: ExerciseHistoryStore, useClass: DexieExerciseHistoryStore },
        { provide: EventBus, useClass: InMemoryEventBus },
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    await db.open();
    await db.sessions.bulkAdd([session('s1', 1), session('s2', 2), session('live', 3, 'in-progress')].map(toSessionRow));
    await db.workedSets.bulkAdd([a, b, other, lift('l', 'live', at(3, 5), 50, 5, false)].map(toWorkedSetRow));
    await db.personalRecords.bulkAdd([prRow('pr-a', a), prRow('pr-b', b), prRow('pr-o', other)]);
    useCase = TestBed.inject(CorrectPastSetUseCase);
    events = [];
    const bus = TestBed.inject(EventBus);
    bus.subscribe('WorkedSetEdited', (e) => events.push(e.name));
    bus.subscribe('WorkedSetRemoved', (e) => events.push(e.name));
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  const setsOf = async (exerciseId: string) =>
    (await db.workedSets.where('exerciseId').equals(exerciseId).sortBy('createdAt')).map((r) => [r.id, r.weightKg, r.isPR]);
  const recordsOf = async (exerciseId: string) =>
    (await db.personalRecords.where('exerciseId').equals(exerciseId).toArray())
      .map((r) => [r.workedSetId, r.weightKg])
      .sort();

  it('editing an old set saves the new value and recomputes the records after it', async () => {
    // "cargué 60 en vez de 80": day 1 was really 80 kg, so day 2's 70 kg is no longer a record.
    await useCase.edit('s1', { ...a, weight: { value: 80 } as Weight });

    expect(await setsOf('ex-1')).toEqual([['a', 80, true], ['b', 70, false], ['l', 50, false]]);
    expect(await recordsOf('ex-1')).toEqual([['a', 80]]);
    expect(events).toEqual(['WorkedSetEdited']);
  });

  it('keeps what the edit must not change: session, exercise, type and time of the set', async () => {
    await useCase.edit('s1', { ...a, sessionId: 's2', exerciseId: 'ex-2', createdAt: at(9), reps: { value: 6 } as Reps });

    const row = (await db.workedSets.get('a'))!;
    expect([row.sessionId, row.exerciseId, row.type, row.createdAt, row.reps]).toEqual(['s1', 'ex-1', 'weight-reps', at(1, 5), 6]);
  });

  it('removing a record lets the next set become the record', async () => {
    await useCase.remove('s1', 'a');

    expect(await setsOf('ex-1')).toEqual([['b', 70, true], ['l', 50, false]]);
    expect(await recordsOf('ex-1')).toEqual([['b', 70]]);
    expect(events).toEqual(['WorkedSetRemoved']);
  });

  it('removing the only set of a session leaves the session, with no sets (S3)', async () => {
    await useCase.remove('s2', 'b');

    expect(await db.sessions.get('s2')).toBeDefined();
    expect(await db.workedSets.where('sessionId').equals('s2').count()).toBe(0);
  });

  it('never touches other exercises', async () => {
    await useCase.edit('s1', { ...a, weight: { value: 80 } as Weight });
    await useCase.remove('s2', 'b');

    expect(await setsOf('ex-2')).toEqual([['o', 100, true]]);
    expect(await db.personalRecords.get('pr-o')).toEqual(prRow('pr-o', other));
  });

  it('rejects the session in progress (corrected inside the session) and unknown sessions or sets (S4)', async () => {
    await expect(useCase.edit('live', lift('l', 'live', at(3, 5), 55, 5, false))).rejects.toThrow(SessionStillInProgressError);
    await expect(useCase.remove('live', 'l')).rejects.toThrow(SessionStillInProgressError);
    await expect(useCase.remove('nope', 'a')).rejects.toThrow(SessionNotFoundError);
    // A set of another session is not this session's to correct.
    await expect(useCase.remove('s2', 'a')).rejects.toThrow('Set a is not part of session s2');

    expect(await setsOf('ex-1')).toEqual([['a', 60, true], ['b', 70, true], ['l', 50, false]]);
    expect(events).toEqual([]);
  });
});
