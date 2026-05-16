import { TestBed } from '@angular/core/testing';
import { CompleteSessionUseCase } from './complete-session.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';
import { EventBus } from '@core/shared/events/event-bus';
import { DomainEvent } from '@core/shared/events/domain-event';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';

class StubSessionRepository extends SessionRepository {
  sessions: Record<string, Session> = {};

  override getActive() { return Promise.resolve(null); }
  override async getById(id: string) { return this.sessions[id] ?? null; }
  override save(s: Session) { this.sessions[s.id] = s; return Promise.resolve(); }
  override addSetToSession(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, _setId: string) { return Promise.resolve(); }
  override getAllWorkedSetsForExercise(_eId: string) { return Promise.resolve([]); }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
}

class StubEventBus extends EventBus {
  publishedEvents: DomainEvent[] = [];
  override publish(event: DomainEvent) { this.publishedEvents.push(event); }
  override subscribe(_name: string, _handler: (e: DomainEvent) => void) { return () => {}; }
}

function makeSession(status: 'in-progress' | 'completed' = 'in-progress'): Session {
  return {
    id: 'session-1', routineId: 'r-1', dayId: 'd-1',
    date: '2024-01-01', startedAt: new Date(), status,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

describe('CompleteSessionUseCase', () => {
  let useCase: CompleteSessionUseCase;
  let repo: StubSessionRepository;
  let eventBus: StubEventBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CompleteSessionUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: EventBus, useClass: StubEventBus },
      ],
    });
    useCase = TestBed.inject(CompleteSessionUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
    eventBus = TestBed.inject(EventBus) as StubEventBus;
  });

  it('should throw SessionNotInProgressError when session is already completed', async () => {
    repo.sessions['session-1'] = makeSession('completed');

    await expect(
      useCase.execute({ sessionId: 'session-1' }),
    ).rejects.toThrow(SessionNotInProgressError);
  });

  it('should return a session with status completed and endedAt set', async () => {
    repo.sessions['session-1'] = makeSession();

    const result = await useCase.execute({ sessionId: 'session-1' });

    expect(result.status).toBe('completed');
    expect(result.endedAt).toBeInstanceOf(Date);
  });

  it('should persist the completed session via repo.save()', async () => {
    repo.sessions['session-1'] = makeSession();
    const spy = jest.spyOn(repo, 'save');

    await useCase.execute({ sessionId: 'session-1' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].status).toBe('completed');
  });

  // D-23/S10
  it('should publish SessionCompleted event exactly once', async () => {
    repo.sessions['session-1'] = makeSession();

    await useCase.execute({ sessionId: 'session-1' });

    const completedEvents = eventBus.publishedEvents.filter(e => e.name === 'SessionCompleted');
    expect(completedEvents.length).toBe(1);
  });
});
