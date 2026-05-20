import { ApplicationConfig, APP_INITIALIZER, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import { AuditEventLogRepository } from '@core/shared/events/audit-event-log.repository';
import { DexieAuditEventLogRepository } from '@core/shared/data/dexie-audit-event-log.repository';
import { AuditEventLogListener } from '@core/shared/events/audit-event-log.listener';

// Profile repository at root so UserPreferencesService (root-scoped) can inject it.
// ADR-22 addendum — consistent with AuditEventLogRepository pattern.
import { ProfileRepository } from '@features/profile/domain/profile.repository';
import { DexieProfileRepository } from '@features/profile/data/dexie-profile.repository';

import { ForgeDatabaseService } from '@core/db/forge-database.service';

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

    // Profile repository at root — allows UserPreferencesService to access profile
    // from any feature without coupling training/progress routes to profile.routes.ts.
    // ADR-22 addendum. The route-level binding in profile.routes.ts becomes a no-op shadow.
    { provide: ProfileRepository, useClass: DexieProfileRepository },

    // Dev-only demo seeder — never loaded in production.
    // Dynamic import keeps @core/dev/dev-seed out of the prod bundle entirely.
    {
      provide: APP_INITIALIZER,
      useFactory: (db: ForgeDatabaseService) => async (): Promise<void> => {
        if (isDevMode() && new URLSearchParams(window.location.search).get('seed') === 'demo') {
          const { seedDemoData } = await import('@core/dev/dev-seed');
          await seedDemoData(db);
          window.history.replaceState({}, '', window.location.pathname);
        }
      },
      deps: [ForgeDatabaseService],
      multi: true,
    },
  ],
};
