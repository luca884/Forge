import { TestBed } from '@angular/core/testing';
import { EditWorkedSetUseCase } from './edit-worked-set.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet, WeightRepsSet } from '../worked-set';
import { EventBus } from '@core/shared/events/event-bus';
import { DomainEvent } from '@core/shared/events/domain-event';
import { PersonalRecordDetector } from '../services/personal-record-detector';
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
  override editWorkedSet(_sId: string, set: WorkedSet) {
    const idx = this.workedSets.findIndex(s => s.id === set.id);
    if (idx >= 0) this.workedSets[idx] = set;
    return Promise.resolve();
  }
  override removeWorkedSet(_sId: string, _setId: string) { return Promise.resolve(); }
  override getAllWorkedSetsForExercise(_eId: string) {
    return Promise.resolve(this.workedSets.filter(s => s.exerciseId === _eId));
  }
  override getSetsForSession(_sId: string) { return Promise.resolve(this.workedSets); }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
}

class StubEventBus extends EventBus {
  publishedEvents: DomainEvent[] = [];
  override publish<E extends DomainEvent>(event: E) { this.publishedEvents.push(event); }
  override subscribe<E extends DomainEvent>(_name: E['name'], _handler: (e: E) => void) { return () => {}; }
}

class StubPRDetector {
  returnValue = false;
  isPR(_set: WorkedSet, _history: WorkedSet[]) { return this.returnValue; }
}

function makeSession(status: 'in-progress' | 'completed' = 'in-progress'): Session {
  return {
    id: 'session-1', routineId: 'r-1', dayId: 'd-1',
    date: '2024-01-01', startedAt: new Date(), status,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

function makeWeightRepsSet(id = 'set-1'): WeightRepsSet {
  return {
    id, sessionId: 'session-1', exerciseId: 'ex-1',
    isPR: false, createdAt: new Date(),
    type: 'weight-reps',
    reps: new Reps(10),
    weight: new Weight(100),
  };
}

describe('EditWorkedSetUseCase', () => {
  let useCase: EditWorkedSetUseCase;
  let repo: StubSessionRepository;
  let eventBus: StubEventBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EditWorkedSetUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: EventBus, useClass: StubEventBus },
        { provide: PersonalRecordDetector, useValue: new StubPRDetector() },
      ],
    });
    useCase = TestBed.inject(EditWorkedSetUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
    eventBus = TestBed.inject(EventBus) as StubEventBus;
  });

  // V-21
  it('should throw SessionNotInProgressError when session is completed', async () => {
    repo.sessions['session-1'] = makeSession('completed');
    const updatedSet = makeWeightRepsSet();

    await expect(
      useCase.execute({ sessionId: 'session-1', updatedSet }),
    ).rejects.toThrow(SessionNotInProgressError);
  });

  it('should call editWorkedSet on the repository', async () => {
    repo.sessions['session-1'] = makeSession();
    const set = makeWeightRepsSet();
    repo.workedSets.push(set);
    const spy = jest.spyOn(repo, 'editWorkedSet');

    const updated: WeightRepsSet = { ...set, reps: new Reps(12) };
    await useCase.execute({ sessionId: 'session-1', updatedSet: updated });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should publish WorkedSetEdited event with previousSet and newSet', async () => {
    repo.sessions['session-1'] = makeSession();
    const originalSet = makeWeightRepsSet();
    repo.workedSets.push(originalSet);
    const updatedSet: WeightRepsSet = { ...originalSet, reps: new Reps(12) };

    await useCase.execute({ sessionId: 'session-1', updatedSet });

    const editedEvent = eventBus.publishedEvents.find(e => e.name === 'WorkedSetEdited');
    expect(editedEvent).toBeDefined();
  });

  it('should return the updated WorkedSet', async () => {
    repo.sessions['session-1'] = makeSession();
    const originalSet = makeWeightRepsSet();
    repo.workedSets.push(originalSet);
    const updatedSet: WeightRepsSet = { ...originalSet, reps: new Reps(15) };

    const result = await useCase.execute({ sessionId: 'session-1', updatedSet });
    expect((result as WeightRepsSet).reps.value).toBe(15);
  });
});
