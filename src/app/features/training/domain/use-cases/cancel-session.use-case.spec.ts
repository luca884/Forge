/**
 * CancelSessionUseCase spec — TDD strict (RED before GREEN).
 *
 * Cancelar = borrar PRs huérfanos → borrar sets → borrar sesión.
 * No se emiten eventos (la sesión desaparece, no "completó").
 */
import { TestBed } from '@angular/core/testing';
import { CancelSessionUseCase } from './cancel-session.use-case';
import { SessionRepository } from '../session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { TrackingType } from '@core/shared/domain/tracking-type';

// ─── Stubs ────────────────────────────────────────────────────────────────────

class StubSessionRepository extends SessionRepository {
  sessions: Record<string, Session> = {};
  sets: WorkedSet[] = [];
  deletedSessionIds: string[] = [];
  deletedSetIds: string[] = [];

  override getActive() { return Promise.resolve(null); }
  override getById(id: string) { return Promise.resolve(this.sessions[id] ?? null); }
  override save(s: Session) { this.sessions[s.id] = s; return Promise.resolve(); }
  override addSetToSession(_sId: string, set: WorkedSet) {
    this.sets.push(set);
    return Promise.resolve();
  }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, setId: string) {
    this.sets = this.sets.filter(s => s.id !== setId);
    return Promise.resolve();
  }
  override getSetsForSession(sId: string) {
    return Promise.resolve(this.sets.filter(s => s.sessionId === sId));
  }
  override getAllWorkedSetsForExercise(eId: string) {
    return Promise.resolve(this.sets.filter(s => s.exerciseId === eId));
  }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(sessionId: string) {
    this.deletedSessionIds.push(sessionId);
    delete this.sessions[sessionId];
    return Promise.resolve();
  }
  override deleteSetsBySessionId(sessionId: string) {
    const ids = this.sets.filter(s => s.sessionId === sessionId).map(s => s.id);
    this.deletedSetIds.push(...ids);
    this.sets = this.sets.filter(s => s.sessionId !== sessionId);
    return Promise.resolve(ids);
  }
}

class StubPersonalRecordRepository extends PersonalRecordRepository {
  records: PersonalRecord[] = [];
  deletedWorkedSetIds: ReadonlySet<string>[] = [];

  override save(r: PersonalRecord) { this.records.push(r); return Promise.resolve(); }
  override getById(id: string) {
    return Promise.resolve(this.records.find(r => r.id === id) ?? null);
  }
  override getCurrentForExercise(_exerciseId: string, _type: TrackingType) {
    return Promise.resolve(null);
  }
  override listAll(_exerciseId?: string) { return Promise.resolve([]); }
  override existsByExerciseId(_exerciseId: string) { return Promise.resolve(false); }
  override deleteByWorkedSetIds(ids: ReadonlySet<string>) {
    this.deletedWorkedSetIds.push(ids);
    this.records = this.records.filter(r => !ids.has(r.workedSetId));
    return Promise.resolve();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(status: Session['status'] = 'in-progress'): Session {
  return {
    id: 'session-1',
    routineId: 'r-1',
    dayId: 'd-1',
    date: '2024-01-01',
    startedAt: new Date(),
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeSet(id: string, sessionId = 'session-1'): WorkedSet {
  return {
    id,
    sessionId,
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: 5 } as any,
    weight: { value: 80 } as any,
    isPR: false,
    createdAt: new Date(),
  } as WorkedSet;
}

function makePR(id: string, workedSetId: string): PersonalRecord {
  return {
    id,
    exerciseId: 'ex-1',
    trackingType: 'weight-reps',
    workedSetId,
    achievedAt: new Date(),
    set: makeSet(workedSetId),
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('CancelSessionUseCase', () => {
  let useCase: CancelSessionUseCase;
  let sessionRepo: StubSessionRepository;
  let prRepo: StubPersonalRecordRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CancelSessionUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: PersonalRecordRepository, useClass: StubPersonalRecordRepository },
      ],
    });
    useCase = TestBed.inject(CancelSessionUseCase);
    sessionRepo = TestBed.inject(SessionRepository) as StubSessionRepository;
    prRepo = TestBed.inject(PersonalRecordRepository) as StubPersonalRecordRepository;
  });

  // ── Error cases ────────────────────────────────────────────────────────────

  it('throws SessionNotFoundError when session does not exist', async () => {
    await expect(
      useCase.execute({ sessionId: 'nonexistent' }),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('throws SessionNotInProgressError when session is already completed', async () => {
    sessionRepo.sessions['session-1'] = makeSession('completed');

    await expect(
      useCase.execute({ sessionId: 'session-1' }),
    ).rejects.toThrow(SessionNotInProgressError);
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('happy path: deletes session after deleting sets and PRs', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sets.push(makeSet('set-1'), makeSet('set-2'));
    prRepo.records.push(makePR('pr-1', 'set-1'));

    await useCase.execute({ sessionId: 'session-1' });

    expect(sessionRepo.deletedSessionIds).toContain('session-1');
    expect(sessionRepo.sessions['session-1']).toBeUndefined();
  });

  it('deletes all worked sets of the session', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sets.push(makeSet('set-1'), makeSet('set-2'));

    await useCase.execute({ sessionId: 'session-1' });

    expect(sessionRepo.deletedSetIds).toEqual(expect.arrayContaining(['set-1', 'set-2']));
    expect(sessionRepo.sets.filter(s => s.sessionId === 'session-1')).toHaveLength(0);
  });

  it('deletes PRs whose workedSetId belongs to the cancelled session', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sets.push(makeSet('set-1'));
    prRepo.records.push(makePR('pr-1', 'set-1'));

    await useCase.execute({ sessionId: 'session-1' });

    expect(prRepo.records).toHaveLength(0);
    expect(prRepo.deletedWorkedSetIds[0]).toEqual(new Set(['set-1']));
  });

  it('leaves PRs from other sessions untouched', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sessions['session-2'] = makeSession('in-progress');
    // session-1 has set-1; session-2 has set-2 with its own PR
    sessionRepo.sets.push(makeSet('set-1', 'session-1'), makeSet('set-2', 'session-2'));
    prRepo.records.push(makePR('pr-for-set-2', 'set-2'));

    await useCase.execute({ sessionId: 'session-1' });

    expect(prRepo.records).toHaveLength(1);
    expect(prRepo.records[0]!.id).toBe('pr-for-set-2');
  });

  it('handles session with no sets (no-op on sets and PRs)', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    // no sets

    await expect(useCase.execute({ sessionId: 'session-1' })).resolves.not.toThrow();
    expect(sessionRepo.deletedSessionIds).toContain('session-1');
  });

  it('handles sets with no PRs (no PRs to delete)', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sets.push(makeSet('set-1'));
    // no PRs

    await expect(useCase.execute({ sessionId: 'session-1' })).resolves.not.toThrow();
    expect(sessionRepo.deletedSetIds).toContain('set-1');
  });

  // ── Order of operations ────────────────────────────────────────────────────
  // Invariant: PRs deleted before sets, sets before session.
  // This ensures partial failure leaves the DB in a consistent recoverable state.

  it('deletes PRs before sets before session (call order invariant)', async () => {
    sessionRepo.sessions['session-1'] = makeSession();
    sessionRepo.sets.push(makeSet('set-1'));
    prRepo.records.push(makePR('pr-1', 'set-1'));

    const callOrder: string[] = [];
    jest.spyOn(prRepo, 'deleteByWorkedSetIds').mockImplementation(async (ids) => {
      callOrder.push('prs');
      prRepo.records = prRepo.records.filter(r => !ids.has(r.workedSetId));
    });
    jest.spyOn(sessionRepo, 'deleteSetsBySessionId').mockImplementation(async (sId) => {
      callOrder.push('sets');
      return [];
    });
    jest.spyOn(sessionRepo, 'deleteSession').mockImplementation(async (_sId) => {
      callOrder.push('session');
    });

    await useCase.execute({ sessionId: 'session-1' });

    expect(callOrder).toEqual(['prs', 'sets', 'session']);
  });
});
