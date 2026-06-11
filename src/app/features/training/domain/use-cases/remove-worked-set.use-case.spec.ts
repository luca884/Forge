import { TestBed } from '@angular/core/testing';
import { RemoveWorkedSetUseCase } from './remove-worked-set.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet, WeightRepsSet } from '../worked-set';
import { EventBus } from '@core/shared/events/event-bus';
import { DomainEvent } from '@core/shared/events/domain-event';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

class StubSessionRepository extends SessionRepository {
  sessions: Record<string, Session> = {};
  workedSets: WorkedSet[] = [];

  override getActive() { return Promise.resolve(null); }
  override async getById(id: string) { return this.sessions[id] ?? null; }
  override save(s: Session) { this.sessions[s.id] = s; return Promise.resolve(); }
  override addSetToSession(_sId: string, set: WorkedSet) { this.workedSets.push(set); return Promise.resolve(); }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, setId: string) {
    this.workedSets = this.workedSets.filter(s => s.id !== setId);
    return Promise.resolve();
  }
  override getSetsForSession(_sId: string) { return Promise.resolve(this.workedSets); }
  override getAllWorkedSetsForExercise(_eId: string) { return Promise.resolve(this.workedSets); }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
}

class StubEventBus extends EventBus {
  publishedEvents: DomainEvent[] = [];
  override publish<E extends DomainEvent>(event: E) { this.publishedEvents.push(event); }
  override subscribe<E extends DomainEvent>(_name: E['name'], _handler: (e: E) => void) { return () => {}; }
}

function makeSession(status: 'in-progress' | 'completed' = 'in-progress'): Session {
  return {
    id: 'session-1', routineId: 'r-1', dayId: 'd-1',
    date: '2024-01-01', startedAt: new Date(), status,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

function makeSet(): WeightRepsSet {
  return {
    id: 'set-1', sessionId: 'session-1', exerciseId: 'ex-1',
    isPR: false, createdAt: new Date(),
    type: 'weight-reps', reps: new Reps(10), weight: new Weight(100),
  };
}

describe('RemoveWorkedSetUseCase', () => {
  let useCase: RemoveWorkedSetUseCase;
  let repo: StubSessionRepository;
  let eventBus: StubEventBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RemoveWorkedSetUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: EventBus, useClass: StubEventBus },
      ],
    });
    useCase = TestBed.inject(RemoveWorkedSetUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
    eventBus = TestBed.inject(EventBus) as StubEventBus;
  });

  it('should throw SessionNotInProgressError when session is completed', async () => {
    repo.sessions['session-1'] = makeSession('completed');

    await expect(
      useCase.execute({ sessionId: 'session-1', setId: 'set-1' }),
    ).rejects.toThrow(SessionNotInProgressError);
  });

  it('should call removeWorkedSet on the repository', async () => {
    repo.sessions['session-1'] = makeSession();
    repo.workedSets.push(makeSet());
    const spy = jest.spyOn(repo, 'removeWorkedSet');

    await useCase.execute({ sessionId: 'session-1', setId: 'set-1' });

    expect(spy).toHaveBeenCalledWith('session-1', 'set-1');
  });

  it('should publish WorkedSetRemoved event with the removed set', async () => {
    repo.sessions['session-1'] = makeSession();
    repo.workedSets.push(makeSet());

    await useCase.execute({ sessionId: 'session-1', setId: 'set-1' });

    const removedEvent = eventBus.publishedEvents.find(e => e.name === 'WorkedSetRemoved');
    expect(removedEvent).toBeDefined();
  });
});
