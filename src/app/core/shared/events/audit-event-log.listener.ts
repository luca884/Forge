/**
 * audit-event-log.listener.ts
 * Singleton bridge: EventBus → AuditEventLogRepository.
 *
 * Provided at root in app.config.ts via APP_INITIALIZER. D-6, D-7, ADR-16.
 * NO providedIn — must be explicitly listed in providers at app root.
 * Subscription is permanent (never unsubscribed) for the lifetime of the app.
 */
import { Injectable, inject } from '@angular/core';
import { EventBus } from './event-bus';
import { AuditEventLogRepository } from './audit-event-log.repository';
import { createAuditEvent, AuditEventName } from './audit-event';
import { DomainEvent } from './domain-event';

interface WorkedSetEditedPayload extends DomainEvent {
  readonly sessionId?: string;
  readonly previousSet: unknown;
  readonly newSet: unknown;
}

interface WorkedSetRemovedPayload extends DomainEvent {
  readonly sessionId?: string;
  readonly removedSet: unknown;
}

@Injectable()
export class AuditEventLogListener {
  private readonly bus = inject(EventBus);
  private readonly repo = inject(AuditEventLogRepository);

  /**
   * Subscribe to WorkedSetEdited and WorkedSetRemoved events.
   * Called synchronously by the APP_INITIALIZER factory in app.config.ts.
   * D-6/R4, D-7/R2.
   */
  start(): void {
    this.bus.subscribe<WorkedSetEditedPayload>('WorkedSetEdited', (event) => {
      this.handle('WorkedSetEdited', event).catch((err) => {
        console.error('[AuditEventLogListener] failed to append WorkedSetEdited', err);
      });
    });

    this.bus.subscribe<WorkedSetRemovedPayload>('WorkedSetRemoved', (event) => {
      this.handle('WorkedSetRemoved', event).catch((err) => {
        console.error('[AuditEventLogListener] failed to append WorkedSetRemoved', err);
      });
    });
  }

  private async handle(
    name: AuditEventName,
    event: WorkedSetEditedPayload | WorkedSetRemovedPayload,
  ): Promise<void> {
    const payload = JSON.stringify(
      name === 'WorkedSetEdited'
        ? {
            kind: 'WorkedSetEdited',
            previousSet: (event as WorkedSetEditedPayload).previousSet,
            newSet: (event as WorkedSetEditedPayload).newSet,
          }
        : {
            kind: 'WorkedSetRemoved',
            removedSet: (event as WorkedSetRemovedPayload).removedSet,
          },
    );

    const auditEvent = createAuditEvent(name, payload, event.sessionId);

    try {
      await this.repo.append(auditEvent);
    } catch (err) {
      // Never let a Dexie error crash the bus. D-6 correctness firewall.
      console.error('[AuditEventLogListener] failed to append', err);
    }
  }
}
