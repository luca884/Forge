import { DomainEvent } from './domain-event';

/** Every session (the one in progress included), worked set and record was deleted. */
export interface TrainingHistoryClearedEvent extends DomainEvent {
  readonly name: 'TrainingHistoryCleared';
}
