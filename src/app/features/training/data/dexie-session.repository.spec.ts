import { TestBed } from '@angular/core/testing';
import { DexieSessionRepository } from './dexie-session.repository';
import { SessionRepository } from '../domain/session.repository';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { Session } from '../domain/session.entity';
import { WeightRepsSet, BodyweightRepsSet } from '../domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    routineId: 'routine-1',
    dayId: 'day-1',
    date: '2024-01-15',
    startedAt: new Date('2024-01-15T10:00:00'),
    status: 'in-progress',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

function makeWeightRepsSet(overrides: Partial<WeightRepsSet> = {}): WeightRepsSet {
  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'ex-1',
    isPR: false,
    createdAt: new Date('2024-01-15'),
    type: 'weight-reps',
    reps: new Reps(10),
    weight: new Weight(100),
    ...overrides,
  };
}

describe('DexieSessionRepository', () => {
  let repo: SessionRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    db = new ForgeDatabaseService();
    TestBed.configureTestingModule({
      providers: [
        DexieSessionRepository,
        { provide: SessionRepository, useClass: DexieSessionRepository },
        { provide: ForgeDatabaseService, useValue: db },
      ],
    });
    repo = TestBed.inject(DexieSessionRepository);
    await db.sessions.clear();
    await db.workedSets.clear();
  });

  afterEach(() => {
    db.close();
  });

  // D-25/S5
  it('should return the in-progress session via getActive()', async () => {
    const session1 = makeSession({ id: 'session-1', status: 'in-progress' });
    const session2 = makeSession({ id: 'session-2', status: 'completed' });
    await repo.save(session1);
    await repo.save(session2);

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active!.id).toBe('session-1');
    expect(active!.status).toBe('in-progress');
  });

  it('should return null from getActive() when no in-progress session', async () => {
    const session = makeSession({ status: 'completed' });
    await repo.save(session);
    expect(await repo.getActive()).toBeNull();
  });

  it('should retrieve a session by id', async () => {
    const session = makeSession();
    await repo.save(session);
    const result = await repo.getById('session-1');
    expect(result).not.toBeNull();
    expect(result!.routineId).toBe('routine-1');
  });

  it('should return null for getById when session does not exist', async () => {
    expect(await repo.getById('non-existent')).toBeNull();
  });

  it('should upsert a session on repeated save', async () => {
    const session = makeSession();
    await repo.save(session);
    await repo.save({ ...session, status: 'completed' });

    const result = await repo.getById('session-1');
    expect(result!.status).toBe('completed');
  });

  // D-25/S3: addSet then getAllWorkedSetsForExercise
  it('should add a set to a session and retrieve it', async () => {
    const session = makeSession();
    await repo.save(session);
    const set = makeWeightRepsSet();
    await repo.addSetToSession('session-1', set);

    const sets = await repo.getAllWorkedSetsForExercise('ex-1');
    expect(sets).toHaveLength(1);
    expect(sets[0]!.type).toBe('weight-reps');
    if (sets[0]!.type === 'weight-reps') {
      expect((sets[0] as WeightRepsSet).reps.value).toBe(10);
    }
  });

  // D-25/S4: removeWorkedSet
  it('should remove a worked set from the repository', async () => {
    const session = makeSession();
    await repo.save(session);
    const set = makeWeightRepsSet();
    await repo.addSetToSession('session-1', set);

    await repo.removeWorkedSet('session-1', 'set-1');

    const sets = await repo.getAllWorkedSetsForExercise('ex-1');
    expect(sets).toHaveLength(0);
  });

  it('should edit a worked set', async () => {
    const session = makeSession();
    await repo.save(session);
    const set = makeWeightRepsSet();
    await repo.addSetToSession('session-1', set);

    const updated: WeightRepsSet = { ...set, reps: new Reps(15) };
    await repo.editWorkedSet('session-1', updated);

    const sets = await repo.getAllWorkedSetsForExercise('ex-1');
    if (sets[0]!.type === 'weight-reps') {
      expect((sets[0] as WeightRepsSet).reps.value).toBe(15);
    }
  });

  it('should return all worked sets for an exercise across sessions', async () => {
    await repo.save(makeSession({ id: 'session-1' }));
    await repo.save(makeSession({ id: 'session-2' }));

    await repo.addSetToSession('session-1', makeWeightRepsSet({ id: 'set-1', sessionId: 'session-1', createdAt: new Date('2024-01-01') }));
    await repo.addSetToSession('session-2', makeWeightRepsSet({ id: 'set-2', sessionId: 'session-2', createdAt: new Date('2024-01-02') }));

    const sets = await repo.getAllWorkedSetsForExercise('ex-1');
    expect(sets).toHaveLength(2);
  });

  it('should return the last worked set for an exercise', async () => {
    await repo.save(makeSession());
    const set1 = makeWeightRepsSet({ id: 'set-1', createdAt: new Date('2024-01-01T10:00:00') });
    const set2 = makeWeightRepsSet({ id: 'set-2', createdAt: new Date('2024-01-02T10:00:00'), reps: new Reps(12) });

    await repo.addSetToSession('session-1', set1);
    await repo.addSetToSession('session-1', set2);

    const last = await repo.getLastWorkedSetForExercise('ex-1');
    expect(last).not.toBeNull();
    expect(last!.id).toBe('set-2');
  });

  it('should return null for getLastWorkedSetForExercise when no sets exist', async () => {
    expect(await repo.getLastWorkedSetForExercise('ex-1')).toBeNull();
  });

  it('should handle bodyweight-reps sets with extra weight', async () => {
    await repo.save(makeSession());
    const set: BodyweightRepsSet = {
      id: 'set-bw', sessionId: 'session-1', exerciseId: 'ex-2',
      isPR: false, createdAt: new Date(),
      type: 'bodyweight-reps', reps: new Reps(10), extraWeight: new Weight(20),
    };
    await repo.addSetToSession('session-1', set);
    const sets = await repo.getAllWorkedSetsForExercise('ex-2');
    expect(sets).toHaveLength(1);
    if (sets[0]!.type === 'bodyweight-reps') {
      expect((sets[0] as BodyweightRepsSet).extraWeight?.value).toBe(20);
    }
  });

  // D-24 — getAllSessions
  it('getAllSessions() returns all sessions when no fromDate is provided', async () => {
    const s1 = makeSession({ id: 'session-1', startedAt: new Date('2024-01-01T10:00:00') });
    const s2 = makeSession({ id: 'session-2', startedAt: new Date('2024-02-01T10:00:00') });
    await repo.save(s1);
    await repo.save(s2);

    const result = await repo.getAllSessions();
    expect(result).toHaveLength(2);
  });

  it('getAllSessions(fromDate) returns only sessions at or after the cutoff', async () => {
    const cutoff = new Date('2024-02-01T00:00:00');
    const before = makeSession({ id: 'session-old', startedAt: new Date('2024-01-15T10:00:00') });
    const onCutoff = makeSession({ id: 'session-cutoff', startedAt: new Date('2024-02-01T10:00:00') });
    const after = makeSession({ id: 'session-new', startedAt: new Date('2024-03-01T10:00:00') });
    await repo.save(before);
    await repo.save(onCutoff);
    await repo.save(after);

    const result = await repo.getAllSessions(cutoff);
    expect(result).toHaveLength(2);
    const ids = result.map(s => s.id);
    expect(ids).toContain('session-cutoff');
    expect(ids).toContain('session-new');
    expect(ids).not.toContain('session-old');
  });
});
