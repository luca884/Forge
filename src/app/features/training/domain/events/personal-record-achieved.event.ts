import { DomainEvent } from '@core/shared/events/domain-event';
import { WorkedSet } from '../worked-set';

export interface PersonalRecordAchievedEvent extends DomainEvent {
  readonly name: 'PersonalRecordAchieved';
  readonly sessionId: string;
  readonly workedSet: WorkedSet;
  readonly reason: 'more-reps' | 'more-extra-weight' | 'first-set';
}
