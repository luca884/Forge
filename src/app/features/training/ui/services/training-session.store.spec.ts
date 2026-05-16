import { TestBed } from '@angular/core/testing';
import { TrainingSessionStore } from './training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { EventBus } from '@core/shared/events/event-bus';
import { Session } from '../../domain/session.entity';
import { WorkedSet } from '../../domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

// --- Stubs ---

class StubSessionRepository extends SessionRepository {
  private _activeSession: Session | null = null;
  private _sets: WorkedSet[] = [];

  setActiveSession(s: Session | null): void {
    this._activeSession = s;
  }
  setSets(sets: WorkedSet[]): void {
    this._sets = sets;
  }

  override async getActive(): Promise<Session | null> {
    return this._activeSession;
  }
  override async getById(_id: string): Promise<Session | null> {
    return this._activeSession;
  }
  override async save(_s: Session): Promise<void> {}
  override async addSetToSession(_id: string, _set: WorkedSet): Promise<void> {}
  override async editWorkedSet(_id: string, _set: WorkedSet): Promise<void> {}
  override async removeWorkedSet(_id: string, _setId: string): Promise<void> {}
  override async getSetsForSession(_sessionId: string): Promise<WorkedSet[]> {
    return this._sets;
  }
  override async getAllWorkedSetsForExercise(_id: string): Promise<WorkedSet[]> {
    return this._sets;
  }
  override async getLastWorkedSetForExercise(_id: string): Promise<WorkedSet | null> {
    return null;
  }
}

class StubEventBus extends EventBus {
  private readonly handlers = new Map<string, ((e: unknown) => void)[]>();

  override publish(_event: { name: string; occurredAt: Date }): void {}

  override subscribe<E extends { name: string; occurredAt: Date }>(
    name: E['name'],
    handler: (event: E) => void,
  ): () => void {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name)!.push(handler as (e: unknown) => void);
    return () => {};
  }

  emit(name: string, event: unknown): void {
    (this.handlers.get(name) ?? []).forEach(h => h(event));
  }
}

// --- Helpers ---

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    routineId: 'routine-1',
    dayId: 'day-1',
    date: '2026-05-15',
    startedAt: new Date(),
    status: 'in-progress',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSet(overrides: Partial<WorkedSet> = {}): WorkedSet {
  const repsResult = Reps.tryFrom(10);
  const weightResult = Weight.tryFrom(100);
  if (!repsResult.ok || !weightResult.ok) throw new Error('Invalid test data');

  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: repsResult.value,
    weight: weightResult.value,
    isPR: false,
    createdAt: new Date(),
    ...overrides,
  } as WorkedSet;
}

// --- Tests ---

describe('TrainingSessionStore', () => {
  let store: TrainingSessionStore;
  let sessionRepo: StubSessionRepository;
  let eventBus: StubEventBus;

  beforeEach(() => {
    sessionRepo = new StubSessionRepository();
    eventBus = new StubEventBus();

    TestBed.configureTestingModule({
      providers: [
        TrainingSessionStore,
        { provide: SessionRepository, useValue: sessionRepo },
        { provide: EventBus, useValue: eventBus },
      ],
    });

    store = TestBed.inject(TrainingSessionStore);
  });

  describe('initial state', () => {
    it('has null activeSession on creation', () => {
      expect(store.activeSession()).toBeNull();
    });

    it('has empty workedSets on creation', () => {
      expect(store.workedSets()).toEqual([]);
    });

    it('setsByExercise is empty map on creation', () => {
      expect(store.setsByExercise().size).toBe(0);
    });
  });

  describe('loadActive()', () => {
    it('sets activeSession signal when active session exists', async () => {
      const session = makeSession();
      sessionRepo.setActiveSession(session);

      await store.loadActive();

      expect(store.activeSession()).toEqual(session);
    });

    it('keeps null when no active session', async () => {
      sessionRepo.setActiveSession(null);

      await store.loadActive();

      expect(store.activeSession()).toBeNull();
    });
  });

  describe('refreshSets()', () => {
    it('loads sets for active session from repo', async () => {
      const session = makeSession();
      const sets = [makeSet(), makeSet({ id: 'set-2' })];
      sessionRepo.setActiveSession(session);
      sessionRepo.setSets(sets);

      await store.loadActive();
      await store.refreshSets();

      expect(store.workedSets()).toHaveLength(2);
    });

    it('does nothing when no active session', async () => {
      await store.refreshSets();
      expect(store.workedSets()).toEqual([]);
    });
  });

  describe('setsByExercise computed', () => {
    it('groups sets by exerciseId', async () => {
      const session = makeSession();
      const sets = [
        makeSet({ id: 'set-1', exerciseId: 'ex-1' }),
        makeSet({ id: 'set-2', exerciseId: 'ex-2' }),
        makeSet({ id: 'set-3', exerciseId: 'ex-1' }),
      ];
      sessionRepo.setActiveSession(session);
      sessionRepo.setSets(sets);

      await store.loadActive();
      await store.refreshSets();

      const byEx = store.setsByExercise();
      expect(byEx.get('ex-1')).toHaveLength(2);
      expect(byEx.get('ex-2')).toHaveLength(1);
    });
  });

  describe('event-driven refresh', () => {
    it('refreshes sets when WorkedSetLogged event fires', async () => {
      const session = makeSession();
      const sets = [makeSet()];
      sessionRepo.setActiveSession(session);
      sessionRepo.setSets(sets);

      await store.loadActive();

      // Simulate event emission
      eventBus.emit('WorkedSetLogged', {
        name: 'WorkedSetLogged',
        occurredAt: new Date(),
        sessionId: session.id,
        workedSet: sets[0],
      });

      // Wait for async refresh
      await Promise.resolve();

      expect(store.workedSets()).toHaveLength(1);
    });

    it('refreshes sets when WorkedSetEdited event fires', async () => {
      const session = makeSession();
      sessionRepo.setActiveSession(session);
      sessionRepo.setSets([makeSet()]);

      await store.loadActive();

      eventBus.emit('WorkedSetEdited', {
        name: 'WorkedSetEdited',
        occurredAt: new Date(),
        previousSet: makeSet(),
        newSet: makeSet(),
      });

      await Promise.resolve();

      expect(store.workedSets()).toHaveLength(1);
    });

    it('refreshes sets when WorkedSetRemoved event fires', async () => {
      const session = makeSession();
      sessionRepo.setActiveSession(session);
      sessionRepo.setSets([]);

      await store.loadActive();

      eventBus.emit('WorkedSetRemoved', {
        name: 'WorkedSetRemoved',
        occurredAt: new Date(),
        removedSet: makeSet(),
      });

      await Promise.resolve();

      expect(store.workedSets()).toHaveLength(0);
    });
  });
});
