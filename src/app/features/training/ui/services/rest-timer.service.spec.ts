import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RestTimerService } from './rest-timer.service';
import { EventBus } from '@core/shared/events/event-bus';

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

describe('RestTimerService', () => {
  let service: RestTimerService;
  let eventBus: StubEventBus;

  beforeEach(() => {
    eventBus = new StubEventBus();

    TestBed.configureTestingModule({
      providers: [
        RestTimerService,
        { provide: EventBus, useValue: eventBus },
      ],
    });

    service = TestBed.inject(RestTimerService);
  });

  describe('initial state', () => {
    it('remaining() is null when no timer running', () => {
      expect(service.remaining()).toBeNull();
    });

    it('isRunning() is false initially', () => {
      expect(service.isRunning()).toBe(false);
    });
  });

  describe('start()', () => {
    it('sets remaining to the given seconds', fakeAsync(() => {
      service.start(90);
      expect(service.remaining()).toBe(90);
      service.cancel();
    }));

    it('sets isRunning to true', fakeAsync(() => {
      service.start(90);
      expect(service.isRunning()).toBe(true);
      service.cancel();
    }));

    it('counts down every second', fakeAsync(() => {
      service.start(5);
      expect(service.remaining()).toBe(5);

      tick(1000);
      expect(service.remaining()).toBe(4);

      tick(1000);
      expect(service.remaining()).toBe(3);

      service.cancel();
    }));

    it('sets remaining to null when countdown reaches 0', fakeAsync(() => {
      service.start(3);
      tick(3000);
      expect(service.remaining()).toBeNull();
    }));

    it('sets isRunning to false when countdown reaches 0', fakeAsync(() => {
      service.start(3);
      tick(3000);
      expect(service.isRunning()).toBe(false);
    }));

    it('restarting replaces the current countdown', fakeAsync(() => {
      service.start(90);
      tick(2000);
      service.start(30);
      expect(service.remaining()).toBe(30);

      tick(1000);
      expect(service.remaining()).toBe(29);

      service.cancel();
    }));
  });

  describe('cancel()', () => {
    it('stops the countdown and sets remaining to null', fakeAsync(() => {
      service.start(90);
      tick(2000);
      service.cancel();

      expect(service.remaining()).toBeNull();
      expect(service.isRunning()).toBe(false);
    }));

    it('further ticks do not change remaining after cancel', fakeAsync(() => {
      service.start(90);
      service.cancel();
      tick(5000);
      expect(service.remaining()).toBeNull();
    }));

    it('cancel when not running does not throw', () => {
      expect(() => service.cancel()).not.toThrow();
    });
  });

  describe('skip()', () => {
    it('stops the countdown immediately', fakeAsync(() => {
      service.start(90);
      service.skip();
      expect(service.remaining()).toBeNull();
      expect(service.isRunning()).toBe(false);
    }));

    it('skip when not running does not throw', () => {
      expect(() => service.skip()).not.toThrow();
    });
  });

  describe('WorkedSetLogged event integration', () => {
    it('auto-starts 90s countdown when WorkedSetLogged fires with no restSeconds hint', fakeAsync(() => {
      eventBus.emit('WorkedSetLogged', {
        name: 'WorkedSetLogged',
        occurredAt: new Date(),
        sessionId: 'session-1',
        workedSet: { id: 'set-1', exerciseId: 'ex-1' },
      });

      expect(service.remaining()).toBe(90);
      expect(service.isRunning()).toBe(true);
      service.cancel();
    }));

    it('resets timer on consecutive WorkedSetLogged events', fakeAsync(() => {
      eventBus.emit('WorkedSetLogged', {
        name: 'WorkedSetLogged',
        occurredAt: new Date(),
        sessionId: 'session-1',
        workedSet: { id: 'set-1', exerciseId: 'ex-1' },
      });

      tick(30000);
      expect(service.remaining()).toBe(60);

      // Log another set — timer restarts
      eventBus.emit('WorkedSetLogged', {
        name: 'WorkedSetLogged',
        occurredAt: new Date(),
        sessionId: 'session-1',
        workedSet: { id: 'set-2', exerciseId: 'ex-1' },
      });

      expect(service.remaining()).toBe(90);
      service.cancel();
    }));
  });
});
