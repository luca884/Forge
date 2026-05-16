import { TestBed } from '@angular/core/testing';
import { StartSessionUseCase } from './start-session.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';
import { SessionAlreadyInProgressError } from '../errors/session-already-in-progress.error';

// crypto.randomUUID is not available in jsdom
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    writable: true,
  });
});

class StubSessionRepository extends SessionRepository {
  private activeSession: Session | null = null;
  savedSessions: Session[] = [];

  setActive(session: Session | null) {
    this.activeSession = session;
  }

  override getActive() {
    return Promise.resolve(this.activeSession);
  }
  override getById(_id: string) {
    return Promise.resolve(null);
  }
  override save(session: Session) {
    this.savedSessions.push(session);
    return Promise.resolve();
  }
  override addSetToSession(_sessionId: string, _set: WorkedSet) {
    return Promise.resolve();
  }
  override editWorkedSet(_sessionId: string, _set: WorkedSet) {
    return Promise.resolve();
  }
  override removeWorkedSet(_sessionId: string, _setId: string) {
    return Promise.resolve();
  }
  override getAllWorkedSetsForExercise(_exerciseId: string) {
    return Promise.resolve([]);
  }
  override getLastWorkedSetForExercise(_exerciseId: string) {
    return Promise.resolve(null);
  }
}

describe('StartSessionUseCase', () => {
  let useCase: StartSessionUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StartSessionUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
      ],
    });
    useCase = TestBed.inject(StartSessionUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
  });

  // V-19
  it('should throw SessionAlreadyInProgressError when an in-progress session exists', async () => {
    const existing: Session = {
      id: 'existing-id',
      routineId: 'routine-1',
      dayId: 'day-1',
      date: '2024-01-01',
      startedAt: new Date(),
      status: 'in-progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.setActive(existing);

    await expect(
      useCase.execute({ routineId: 'routine-1', dayId: 'day-1' }),
    ).rejects.toThrow(SessionAlreadyInProgressError);
  });

  it('should carry the existing session id in the error', async () => {
    const existing: Session = {
      id: 'existing-id',
      routineId: 'routine-1',
      dayId: 'day-1',
      date: '2024-01-01',
      startedAt: new Date(),
      status: 'in-progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.setActive(existing);

    try {
      await useCase.execute({ routineId: 'routine-1', dayId: 'day-1' });
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SessionAlreadyInProgressError);
      expect((e as SessionAlreadyInProgressError).existingSessionId).toBe('existing-id');
    }
  });

  it('should create and return a new in-progress session when no active session exists', async () => {
    repo.setActive(null);
    const result = await useCase.execute({ routineId: 'r1', dayId: 'd1' });

    expect(result.status).toBe('in-progress');
    expect(result.routineId).toBe('r1');
    expect(result.dayId).toBe('d1');
    expect(result.id).toBeTruthy();
    expect(result.startedAt).toBeInstanceOf(Date);
  });

  it('should persist the new session via sessionRepo.save()', async () => {
    repo.setActive(null);
    await useCase.execute({ routineId: 'r1', dayId: 'd1' });

    expect(repo.savedSessions.length).toBeGreaterThan(0);
    expect(repo.savedSessions[0]!.status).toBe('in-progress');
  });

  it('should set date as today ISO string (YYYY-MM-DD)', async () => {
    repo.setActive(null);
    const result = await useCase.execute({ routineId: 'r1', dayId: 'd1' });

    const today = new Date().toISOString().slice(0, 10);
    expect(result.date).toBe(today);
  });
});
