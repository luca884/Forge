import { TestBed } from '@angular/core/testing';
import { LogSetUseCase } from './log-set.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet } from '../worked-set';
import { PersonalRecordDetector } from '../services/personal-record-detector';
import { EventBus } from '@core/shared/events/event-bus';
import { DomainEvent } from '@core/shared/events/domain-event';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { InvalidSetInputError } from '../errors/invalid-set-input.error';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';

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
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
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

class StubPersonalRecordRepository extends PersonalRecordRepository {
  savedRecords: PersonalRecord[] = [];
  override save(record: PersonalRecord): Promise<void> {
    this.savedRecords.push(record);
    return Promise.resolve();
  }
  override getById(_id: string): Promise<PersonalRecord | null> { return Promise.resolve(null); }
  override getCurrentForExercise(_exerciseId: string, _trackingType: import('@core/shared/domain/tracking-type').TrackingType): Promise<PersonalRecord | null> { return Promise.resolve(null); }
  override listAll(_exerciseId?: string): Promise<PersonalRecord[]> { return Promise.resolve([]); }
  override existsByExerciseId(_exerciseId: string): Promise<boolean> { return Promise.resolve(false); }
  override deleteByWorkedSetIds(_ids: ReadonlySet<string>): Promise<void> { return Promise.resolve(); }
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
  let prRepo: StubPersonalRecordRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogSetUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
        { provide: EventBus, useClass: StubEventBus },
        { provide: PersonalRecordDetector, useValue: new StubPRDetector() },
        { provide: PersonalRecordRepository, useClass: StubPersonalRecordRepository },
      ],
    });
    useCase = TestBed.inject(LogSetUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
    eventBus = TestBed.inject(EventBus) as StubEventBus;
    prDetector = TestBed.inject(PersonalRecordDetector) as unknown as StubPRDetector;
    prRepo = TestBed.inject(PersonalRecordRepository) as StubPersonalRecordRepository;
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

  // P3 — V-64: PersonalRecordRepository.save called when isPR === true
  it('should call personalRecordRepo.save once with correct PR shape when isPR is true', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = true;

    const result = await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'weight-reps',
      repsValue: 10,
      weightKgValue: 100,
    });

    expect(prRepo.savedRecords).toHaveLength(1);
    const saved = prRepo.savedRecords[0];
    expect(saved?.exerciseId).toBe('ex-1');
    expect(saved?.trackingType).toBe('weight-reps');
    expect(saved?.workedSetId).toBe(result.id);
    expect(saved?.set).toEqual(result);
    expect(typeof saved?.id).toBe('string');
    expect(saved?.achievedAt).toBeInstanceOf(Date);
  });

  // P3 — V-65: personalRecordRepo.save NOT called when isPR === false
  it('should NOT call personalRecordRepo.save when isPR is false', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'weight-reps',
      repsValue: 10,
      weightKgValue: 100,
    });

    expect(prRepo.savedRecords).toHaveLength(0);
  });

  // Línea 39: SessionNotFoundError cuando la sesión no existe
  it('should throw SessionNotFoundError when session does not exist', async () => {
    // repo.sessions is empty — getById returns null
    await expect(
      useCase.execute({ sessionId: 'non-existent', exerciseId: 'ex-1', type: 'weight-reps', repsValue: 10, weightKgValue: 100 }),
    ).rejects.toThrow(SessionNotFoundError);
  });

  // Línea 70: prRepo.save falla pero el set YA quedó persistido (R-8)
  it('should still persist the set and emit events even when prRepo.save throws (R-8)', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = true;
    jest.spyOn(prRepo, 'save').mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'weight-reps',
      repsValue: 10,
      weightKgValue: 100,
    });

    // Set must be persisted
    expect(repo.workedSets).toHaveLength(1);
    expect(repo.workedSets[0]?.id).toBe(result.id);
    // Events still emitted
    const names = eventBus.publishedEvents.map(e => e.name);
    expect(names).toContain('WorkedSetLogged');
    expect(names).toContain('PersonalRecordAchieved');
    // Error must be logged (non-fatal)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[LogSetUseCase]'),
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  // Líneas 123-125: bodyweight-reps con extraWeightKgValue inválido → InvalidSetInputError
  it('should throw InvalidSetInputError for bodyweight-reps with invalid extraWeightKg (negative)', async () => {
    repo.sessions['session-1'] = makeInProgressSession();

    await expect(
      useCase.execute({
        sessionId: 'session-1',
        exerciseId: 'ex-1',
        type: 'bodyweight-reps',
        repsValue: 10,
        extraWeightKgValue: -5,
      }),
    ).rejects.toThrow(InvalidSetInputError);
  });

  // type 'time' — happy path: durationSec viene de durationSecValue (NO de repsValue)
  it('should log a time set with durationSec from durationSecValue', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    const result = await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'time',
      durationSecValue: 90,
    });

    expect(result.type).toBe('time');
    if (result.type === 'time') {
      expect(result.durationSec).toBe(90);
    }
    expect(result.isPR).toBe(false);
    expect(result.sessionId).toBe('session-1');
  });

  // type 'distance-time' — happy path: distanceKm y durationSec vienen de sus propios valores
  it('should log a distance-time set with distanceKm and durationSec from their own values', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    const result = await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'distance-time',
      distanceKmValue: 5,
      durationSecValue: 1800,
    });

    expect(result.type).toBe('distance-time');
    if (result.type === 'distance-time') {
      expect(result.durationSec).toBe(1800);
      expect(result.distanceKm).toBe(5);
    }
    expect(result.isPR).toBe(false);
  });

  // type 'time' — persisted and event emitted
  it('should persist time set to session and emit WorkedSetLogged', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'time',
      durationSecValue: 60,
    });

    expect(repo.workedSets).toHaveLength(1);
    const names = eventBus.publishedEvents.map(e => e.name);
    expect(names).toContain('WorkedSetLogged');
  });

  // type 'distance-time' — persisted and event emitted
  it('should persist distance-time set to session and emit WorkedSetLogged', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = false;

    await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'distance-time',
      distanceKmValue: 10,
      durationSecValue: 3600,
    });

    expect(repo.workedSets).toHaveLength(1);
    const names = eventBus.publishedEvents.map(e => e.name);
    expect(names).toContain('WorkedSetLogged');
  });

  // P3 — V-66: event order — set added to session BEFORE PR saved, events emitted after
  it('should persist set to session before saving PR and emit both events after', async () => {
    repo.sessions['session-1'] = makeInProgressSession();
    prDetector.returnValue = true;
    const callOrder: string[] = [];

    jest.spyOn(repo, 'addSetToSession').mockImplementation(async (sId, set) => {
      callOrder.push('addSetToSession');
      repo.workedSets.push(set);
    });
    jest.spyOn(prRepo, 'save').mockImplementation(async (_record) => {
      callOrder.push('prRepo.save');
    });
    jest.spyOn(eventBus, 'publish').mockImplementation((event) => {
      callOrder.push(`event:${event.name}`);
    });

    await useCase.execute({
      sessionId: 'session-1',
      exerciseId: 'ex-1',
      type: 'weight-reps',
      repsValue: 5,
      weightKgValue: 80,
    });

    // Set must be persisted before PR record; events come after
    expect(callOrder[0]).toBe('addSetToSession');
    expect(callOrder[1]).toBe('prRepo.save');
    // Both events must appear
    expect(callOrder).toContain('event:WorkedSetLogged');
    expect(callOrder).toContain('event:PersonalRecordAchieved');
  });
});
