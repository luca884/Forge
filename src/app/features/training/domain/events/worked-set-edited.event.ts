import { DomainEvent } from '@core/shared/events/domain-event';
import { WorkedSet } from '../worked-set';

export interface WorkedSetEditedEvent extends DomainEvent {
  readonly name: 'WorkedSetEdited';
  readonly sessionId: string;
  readonly previousSet: WorkedSet;
  readonly newSet: WorkedSet;
}
