import { DomainEvent } from '@core/shared/events/domain-event';

export interface SessionCompletedEvent extends DomainEvent {
  readonly name: 'SessionCompleted';
  readonly sessionId: string;
  readonly completedAt: Date;
}
