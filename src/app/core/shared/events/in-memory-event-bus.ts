import { Injectable } from '@angular/core';
import { EventBus } from './event-bus';
import { type DomainEvent } from './domain-event';

@Injectable()
export class InMemoryEventBus extends EventBus {
  private readonly handlers = new Map<string, Set<(event: DomainEvent) => void>>();

  publish<E extends DomainEvent>(event: E): void {
    const set = this.handlers.get(event.name);
    if (!set) return;
    for (const handler of set) {
      handler(event);
    }
  }

  subscribe<E extends DomainEvent>(
    name: E['name'],
    handler: (event: E) => void,
  ): () => void {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set());
    }
    const set = this.handlers.get(name)!;
    const wrappedHandler = handler as (event: DomainEvent) => void;
    set.add(wrappedHandler);

    return () => {
      set.delete(wrappedHandler);
    };
  }
}
