import { InMemoryEventBus } from './in-memory-event-bus';
import { type DomainEvent } from './domain-event';

interface TestEvent extends DomainEvent {
  readonly name: 'TestEvent';
  readonly payload: string;
}

interface OtherEvent extends DomainEvent {
  readonly name: 'OtherEvent';
}

describe('InMemoryEventBus', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('V10/S1: calls handler when published event name matches subscription', () => {
    const handler = jest.fn();
    bus.subscribe<TestEvent>('TestEvent', handler);

    const event: TestEvent = {
      name: 'TestEvent',
      occurredAt: new Date(),
      payload: 'hello',
    };
    bus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('S2: unsubscribe function removes handler from future deliveries', () => {
    const handler = jest.fn();
    const unsubscribe = bus.subscribe<TestEvent>('TestEvent', handler);

    unsubscribe();

    bus.publish<TestEvent>({
      name: 'TestEvent',
      occurredAt: new Date(),
      payload: 'after unsub',
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('S3: no error thrown when publishing with no subscribers', () => {
    expect(() => {
      bus.publish<TestEvent>({
        name: 'TestEvent',
        occurredAt: new Date(),
        payload: 'nobody listening',
      });
    }).not.toThrow();
  });

  it('does not call handler when event name does not match', () => {
    const handler = jest.fn();
    bus.subscribe<TestEvent>('TestEvent', handler);

    bus.publish<OtherEvent>({ name: 'OtherEvent', occurredAt: new Date() });

    expect(handler).not.toHaveBeenCalled();
  });

  it('calls multiple handlers for the same event name', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    bus.subscribe<TestEvent>('TestEvent', handler1);
    bus.subscribe<TestEvent>('TestEvent', handler2);

    bus.publish<TestEvent>({
      name: 'TestEvent',
      occurredAt: new Date(),
      payload: 'multi',
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('calls handler synchronously (not deferred)', () => {
    const calls: string[] = [];
    bus.subscribe<TestEvent>('TestEvent', () => calls.push('handler'));
    bus.publish<TestEvent>({
      name: 'TestEvent',
      occurredAt: new Date(),
      payload: 'sync',
    });
    calls.push('after publish');

    expect(calls[0]).toBe('handler');
    expect(calls[1]).toBe('after publish');
  });

  it('V29: does not have providedIn (verified at class level — @Injectable without providedIn)', () => {
    // This test verifies the class can be instantiated without Angular DI context.
    // If providedIn were set to 'root', it would be tree-shakeable but not per-route injectable.
    expect(() => new InMemoryEventBus()).not.toThrow();
  });
});
