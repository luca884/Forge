import { TestBed } from '@angular/core/testing';
import { GetActiveSessionUseCase } from './get-active-session.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';

class StubSessionRepository extends SessionRepository {
  activeSession: Session | null = null;

  override getActive() {
    return Promise.resolve(this.activeSession);
  }
  override getById(_id: string) { return Promise.resolve(null); }
  override save(_s: Session) { return Promise.resolve(); }
  override addSetToSession(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, _setId: string) { return Promise.resolve(); }
  override getSetsForSession(_sId: string) { return Promise.resolve([]); }
  override getAllWorkedSetsForExercise(_eId: string) { return Promise.resolve([]); }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
}

describe('GetActiveSessionUseCase', () => {
  let useCase: GetActiveSessionUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetActiveSessionUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
      ],
    });
    useCase = TestBed.inject(GetActiveSessionUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
  });

  it('should return null when no active session exists', async () => {
    repo.activeSession = null;
    expect(await useCase.execute()).toBeNull();
  });

  it('should return the active session when it exists', async () => {
    const session: Session = {
      id: 's-1',
      routineId: 'r-1',
      dayId: 'd-1',
      date: '2024-01-01',
      startedAt: new Date(),
      status: 'in-progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.activeSession = session;
    expect(await useCase.execute()).toEqual(session);
  });
});
