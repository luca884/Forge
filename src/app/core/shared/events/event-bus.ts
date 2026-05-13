import { type DomainEvent } from './domain-event';

export abstract class EventBus {
  abstract publish<E extends DomainEvent>(event: E): void;
  abstract subscribe<E extends DomainEvent>(
    name: E['name'],
    handler: (event: E) => void,
  ): () => void;
}
