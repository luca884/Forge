import { TestBed } from '@angular/core/testing';
import { LogSetUseCase } from './log-set.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';
import { PersonalRecordDetector } from '../services/personal-record-detector';
import { EventBus } from '@core/shared/events/event-bus';
import { DomainEvent } from '@core/shared/events/domain-event';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { InvalidSetInputError } from '../errors/invalid-set-input.error';

// crypto mock
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    writable: true,
  });
});

class StubSessionRepository extends SessionRepository {
  sessions: Record<string, Session> = {};
  workedSets: WorkedSet[] = [];

  override getActive() { return Promise.resolve(null); }
  override async getById(id: string) { return this.sessions[id] ?? null; }
  override save(s: Session) { this.sessions[s.id] = s; return Promise.resolve(); }
  override addSetToSession(_sId: string, set: WorkedSet) {
    this.workedSets.push(set);
    return Promise.resolve();
  }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
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
  override subscribe<E extends DomainEvent>(_name: E['name'], _handler: (e: E) => void) {
    return () => {};
  }
}

class StubPRDetector {
  returnValue = false;
  isPR(_set: WorkedSet, _history: WorkedSet[]) { return this.returnValue; }
}

function makeInProgressSession(): Session {
  return {
    id: 'session-1',
    routineId: 'routine-1',
    dayId: 'day-1',
    date: '2024-01-01',
    startedAt: new Date(),
    status: 'in-progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('LogSetUseCase', () => {
  let useCase: LogSetUseCase;
  let repo: StubSessionRepository;
  let eventBus: StubEventBus;
  let prDetector: StubPRDetector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogSetUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: EventBus, useClass: StubEventBus },
        { provide: PersonalRecordDetector, useValue: new StubPRDetector() },
      ],
    });
    useCase = TestBed.inject(LogSetUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
    eventBus = TestBed.inject(EventBus) as StubEventBus;
    prDetector = TestBed.inject(PersonalRecordDetector) as unknown as StubPRDetector;
  });

  it('should throw SessionNotInProgressError when session status is completed', async () => {
    const completed: Session = { ...makeInProgressSession(), status: 'completed' };
    repo.sessions['session-1'] = completed;

    await expect(
      useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 }),
    ).rejects.toThrow(SessionNotInProgressError);
  });

  it('should throw InvalidSetInputError when reps value is invalid (negative)', async () => {
    repo.sessions['session-1'] = makeInProgressSession();

    await expect(
      useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: -1, weightKgValue: 100 }),
    ).rejects.toThrow(InvalidSetInputError);
  });

  it('should throw InvalidSetInputError when weight value is invalid (zero)', async () => {
    repo.sessions['session-1'] = makeInProgressSession();

    await expect(
      useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 0 }),
    ).rejects.toThrow(InvalidSetInputError);
  });

  it('should return the created WorkedSet with isPR=false when PR detector returns false', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    const result = await useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 });

    expect(result.isPR).toBe(false);
    expect(result.type).toBe('weight-reps');
  });

  // V-20: PR=true → WorkedSetLogged + PersonalRecordAchieved
  it('should publish both WorkedSetLogged and PersonalRecordAchieved when isPR is true', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = true;

    await useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 });

    const names = eventBus.publishedEvents.map(e => e.name);
    expect(names).toContain('WorkedSetLogged');
    expect(names).toContain('PersonalRecordAchieved');
  });

  it('should publish WorkedSetLogged but NOT PersonalRecordAchieved when isPR is false', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    await useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 });

    const names = eventBus.publishedEvents.map(e => e.name);
    expect(names).toContain('WorkedSetLogged');
    expect(names).not.toContain('PersonalRecordAchieved');
  });

  it('should call addSetToSession on the repository', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;
    const spy = jest.spyOn(repo, 'addSetToSession');

    await useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should log a bodyweight-reps set with no extra weight', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    const result = await useCase.execute({ sessionId: 'session-1', exerciseId: 'ex-1', type: 'bodyweight-reps', repsValue: 10 });

    expect(result.type).toBe('bodyweight-reps');
    expect(result.isPR).toBe(false);
  });
});
