import { ApplicationConfig, APP_INITIALIZER, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import { AuditEventLogRepository } from '@core/shared/events/audit-event-log.repository';
import { DexieAuditEventLogRepository } from '@core/shared/data/dexie-audit-event-log.repository';
import { AuditEventLogListener } from '@core/shared/events/audit-event-log.listener';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // EventBus at root so AuditEventLogListener can receive events from any feature.
    // Lifted from training.routes.ts (slice-3/P0.12). ADR cross-feature subscription.
    { provide: EventBus, useClass: InMemoryEventBus },

    // Audit infrastructure — root-scoped so subscription survives route navigation.
    // D-7, ADR-16, CC-23.
    { provide: AuditEventLogRepository, useClass: DexieAuditEventLogRepository },
    AuditEventLogListener,
    {
      provide: APP_INITIALIZER,
      useFactory: (listener: AuditEventLogListener) => () => listener.start(),
      deps: [AuditEventLogListener],
      multi: true,
    },
  ],
};
