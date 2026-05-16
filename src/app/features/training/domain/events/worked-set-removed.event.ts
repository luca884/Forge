import { DomainEvent } from '@core/shared/events/domain-event';
import { WorkedSet } from '../worked-set';

export interface WorkedSetRemovedEvent extends DomainEvent {
  readonly name: 'WorkedSetRemoved';
  readonly sessionId: string;
  readonly removedSet: WorkedSet;
}
