import { DomainEvent } from '@core/shared/events/domain-event';
import { WorkedSet } from '../worked-set';

export interface WorkedSetLoggedEvent extends DomainEvent {
  readonly name: 'WorkedSetLogged';
  readonly sessionId: string;
  readonly workedSet: WorkedSet;
}
