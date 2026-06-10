import { TestBed } from '@angular/core/testing';
import { EventBus } from '@core/shared/events/event-bus';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';

// ---------------------------------------------------------------------------
// Mock Worker — simulates the Web Worker message channel without Worker infra
// ---------------------------------------------------------------------------
type MessageHandler = (event: MessageEvent) => void;

class MockWorker {
  static readonly instances: MockWorker[] = [];

  readonly postMessage = jest.fn();
  onmessage: MessageHandler | null = null;

  constructor() {
    MockWorker.instances.push(this);
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  terminate = jest.fn();
}

// rest-timer-worker.factory uses `import.meta.url` which Jest's CJS transform
// cannot parse. Mock the factory before importing the service.
jest.mock('./rest-timer-worker.factory', () => ({
  createRestTimerWorker: (): Worker =>
    new (globalThis as unknown as { Worker: new () => Worker }).Worker(),
}));

import { RestTimerService } from './rest-timer.service';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------
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
    (this.handlers.get(name) ?? []).forEach((h) => h(event));
  }
}

class StubNotificationPermissionService {
  permission = jest.fn().mockReturnValue('denied');
  supported = jest.fn().mockReturnValue(false);
  request = jest.fn().mockResolvedValue('denied');
  showTimerDoneNotification = jest.fn();
}

describe('RestTimerService (Worker-based)', () => {
  let service: RestTimerService;
  let eventBus: StubEventBus;
  let notifService: StubNotificationPermissionService;

  beforeEach(() => {
    MockWorker.instances.length = 0;
    jest.clearAllMocks();

    // Install MockWorker globally before the service is created
    Object.defineProperty(globalThis, 'Worker', {
      value: MockWorker,
      writable: true,
      configurable: true,
    });

    eventBus = new StubEventBus();
    notifService = new StubNotificationPermissionService();

    TestBed.configureTestingModule({
      providers: [
        RestTimerService,
        { provide: EventBus, useValue: eventBus },
        { provide: NotificationPermissionService, useValue: notifService },
      ],
    });

    service = TestBed.inject(RestTimerService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('remaining() is null when no timer running', () => {
      expect(service.remaining()).toBeNull();
    });

    it('isRunning() is false initially', () => {
      expect(service.isRunning()).toBe(false);
    });

    it('does not create a Worker until start() is called', () => {
      expect(MockWorker.instances).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // start() — Worker message protocol
  // -------------------------------------------------------------------------
  describe('start()', () => {
    it('creates a Worker on first call (lazy)', () => {
      service.start(90);
      expect(MockWorker.instances).toHaveLength(1);
    });

    it('sends a start message to the Worker with the correct seconds', () => {
      service.start(90);
      const worker = MockWorker.instances[0]!;
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'start',
        payload: { seconds: 90 },
      });
    });

    it('sets isRunning to true after sending start', () => {
      service.start(90);
      expect(service.isRunning()).toBe(true);
    });

    it('sets remaining to the initial seconds', () => {
      service.start(90);
      expect(service.remaining()).toBe(90);
    });

    it('reuses the same Worker instance on repeated start calls', () => {
      service.start(90);
      service.start(30);
      expect(MockWorker.instances).toHaveLength(1);
    });

    it('sends cancel then start when restarting', () => {
      service.start(90);
      const worker = MockWorker.instances[0]!;
      worker.postMessage.mockClear();

      service.start(30);
      expect(worker.postMessage).toHaveBeenNthCalledWith(1, { type: 'cancel' });
      expect(worker.postMessage).toHaveBeenNthCalledWith(2, {
        type: 'start',
        payload: { seconds: 30 },
      });
    });
  });

  // -------------------------------------------------------------------------
  // tick / done messages from Worker
  // -------------------------------------------------------------------------
  describe('Worker inbound messages', () => {
    beforeEach(() => {
      service.start(90);
    });

    it('updates remaining() on tick messages', () => {
      const worker = MockWorker.instances[0]!;
      worker.simulateMessage({ type: 'tick', payload: { remaining: 89 } });
      expect(service.remaining()).toBe(89);
    });

    it('updates remaining on multiple tick messages', () => {
      const worker = MockWorker.instances[0]!;
      worker.simulateMessage({ type: 'tick', payload: { remaining: 89 } });
      worker.simulateMessage({ type: 'tick', payload: { remaining: 88 } });
      expect(service.remaining()).toBe(88);
    });

    it('sets remaining to null and isRunning to false on done', () => {
      const worker = MockWorker.instances[0]!;
      worker.simulateMessage({ type: 'done' });
      expect(service.remaining()).toBeNull();
      expect(service.isRunning()).toBe(false);
    });

    it('calls showTimerDoneNotification() on done', () => {
      const worker = MockWorker.instances[0]!;
      worker.simulateMessage({ type: 'done' });
      expect(notifService.showTimerDoneNotification).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // cancel()
  // -------------------------------------------------------------------------
  describe('cancel()', () => {
    it('sends a cancel message to the Worker', () => {
      service.start(90);
      const worker = MockWorker.instances[0]!;
      service.cancel();
      expect(worker.postMessage).toHaveBeenCalledWith({ type: 'cancel' });
    });

    it('sets remaining to null and isRunning to false', () => {
      service.start(90);
      service.cancel();
      expect(service.remaining()).toBeNull();
      expect(service.isRunning()).toBe(false);
    });

    it('does not throw when called before start()', () => {
      expect(() => service.cancel()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // skip()
  // -------------------------------------------------------------------------
  describe('skip()', () => {
    it('stops the timer immediately', () => {
      service.start(90);
      service.skip();
      expect(service.remaining()).toBeNull();
      expect(service.isRunning()).toBe(false);
    });

    it('does not throw when called before start()', () => {
      expect(() => service.skip()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // WorkedSetLogged event integration
  // -------------------------------------------------------------------------
  describe('WorkedSetLogged event integration', () => {
    it('auto-starts 90s countdown when WorkedSetLogged fires', () => {
      eventBus.emit('WorkedSetLogged', {
        name: 'WorkedSetLogged',
        occurredAt: new Date(),
        sessionId: 'session-1',
        workedSet: { id: 'set-1', exerciseId: 'ex-1' },
      });

      expect(service.isRunning()).toBe(true);
      expect(service.remaining()).toBe(90);
      const worker = MockWorker.instances[0]!;
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'start',
        payload: { seconds: 90 },
      });
    });
  });

  // -------------------------------------------------------------------------
  // destroy — Worker terminates
  // -------------------------------------------------------------------------
  describe('ngOnDestroy()', () => {
    it('terminates the Worker on destroy', () => {
      service.start(90);
      const worker = MockWorker.instances[0]!;
      service.ngOnDestroy();
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it('does not throw on destroy if Worker was never created', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // setRestPlan + WorkedSetLogged per-exercise resolution
  // -------------------------------------------------------------------------
  describe('setRestPlan()', () => {
    const makeEvent = (exerciseId: string) => ({
      name: 'WorkedSetLogged' as const,
      occurredAt: new Date(),
      sessionId: 'session-1',
      workedSet: { id: 'set-1', exerciseId },
    });

    it('uses the plan value for a known exerciseId', () => {
      service.setRestPlan(new Map([['ex-bench', 120]]));

      eventBus.emit('WorkedSetLogged', makeEvent('ex-bench'));

      expect(service.remaining()).toBe(120);
    });

    it('falls back to DEFAULT_REST_SECONDS (90) for an exerciseId not in the plan', () => {
      service.setRestPlan(new Map([['ex-bench', 120]]));

      eventBus.emit('WorkedSetLogged', makeEvent('ex-squat'));

      expect(service.remaining()).toBe(90);
    });

    it('falls back to 90 when no plan has been set', () => {
      eventBus.emit('WorkedSetLogged', makeEvent('ex-any'));

      expect(service.remaining()).toBe(90);
    });

    it('does NOT start the timer when restSeconds = 0 (no-rest rule)', () => {
      // restSeconds = 0 means the athlete wants no rest for this exercise.
      service.setRestPlan(new Map([['ex-cardio', 0]]));

      eventBus.emit('WorkedSetLogged', makeEvent('ex-cardio'));

      expect(service.isRunning()).toBe(false);
      expect(service.remaining()).toBeNull();
    });

    it('replaces a previous plan when called again', () => {
      service.setRestPlan(new Map([['ex-a', 60]]));
      service.setRestPlan(new Map([['ex-a', 30]]));

      eventBus.emit('WorkedSetLogged', makeEvent('ex-a'));

      expect(service.remaining()).toBe(30);
    });
  });
});
