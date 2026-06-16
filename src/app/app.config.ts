import {
  ApplicationConfig,
  APP_INITIALIZER,
  EnvironmentInjector,
  isDevMode,
  provideZoneChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import { AuditEventLogRepository, AuditEventFilter } from '@core/shared/events/audit-event-log.repository';
import { AuditEvent } from '@core/shared/events/audit-event';
import { AuditEventLogListener } from '@core/shared/events/audit-event-log.listener';
import { PwaUpdateService } from '@core/pwa/pwa-update.service';

// Profile repository at root so UserPreferencesService (root-scoped) can inject it.
// ADR-22 addendum — consistent with AuditEventLogRepository pattern.
import { ProfileRepository } from '@features/profile/domain/profile.repository';
import { Profile } from '@features/profile/domain/profile.entity';

import { routes } from './app.routes';

/**
 * Lazy proxy for AuditEventLogRepository.
 * The actual DexieAuditEventLogRepository (and Dexie itself) are loaded via dynamic import
 * on first method call, keeping them out of the initial bundle.
 * ADR-41 / Slice 4 — phase4-lighthouse.
 */
function provideLazyAuditEventLogRepository(envInjector: EnvironmentInjector): AuditEventLogRepository {
  let implPromise: Promise<AuditEventLogRepository> | undefined;

  const getImpl = (): Promise<AuditEventLogRepository> => {
    if (!implPromise) {
      implPromise = import('@core/shared/data/dexie-audit-event-log.repository').then(
        ({ DexieAuditEventLogRepository }) =>
          runInInjectionContext(envInjector, () => new DexieAuditEventLogRepository()),
      );
    }
    return implPromise;
  };

  // Returns a plain object satisfying the AuditEventLogRepository contract.
  // Angular DI provides this value as-is; class hierarchy is not required.
  return {
    append: (event: AuditEvent): Promise<void> => getImpl().then((r) => r.append(event)),
    getAll: (filters?: AuditEventFilter): Promise<AuditEvent[]> => getImpl().then((r) => r.getAll(filters)),
    getBySession: (sessionId: string): Promise<AuditEvent[]> =>
      getImpl().then((r) => r.getBySession(sessionId)),
  } as AuditEventLogRepository;
}

/**
 * Lazy proxy for ProfileRepository.
 * Dexie loads on first get() / save() call; not at bootstrap.
 */
function provideLazyProfileRepository(envInjector: EnvironmentInjector): ProfileRepository {
  let implPromise: Promise<ProfileRepository> | undefined;

  const getImpl = (): Promise<ProfileRepository> => {
    if (!implPromise) {
      implPromise = import('@features/profile/data/dexie-profile.repository').then(
        ({ DexieProfileRepository }) =>
          runInInjectionContext(envInjector, () => new DexieProfileRepository()),
      );
    }
    return implPromise;
  };

  return {
    get: (): Promise<Profile | null> => getImpl().then((r) => r.get()),
    save: (profile: Profile): Promise<void> => getImpl().then((r) => r.save(profile)),
  } as ProfileRepository;
}

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
    // Dexie repository loaded lazily on first event (not at bootstrap). D-7, ADR-16, CC-23.
    {
      provide: AuditEventLogRepository,
      useFactory: provideLazyAuditEventLogRepository,
      deps: [EnvironmentInjector],
    },
    AuditEventLogListener,
    {
      provide: APP_INITIALIZER,
      useFactory: (listener: AuditEventLogListener) => () => listener.start(),
      deps: [AuditEventLogListener],
      multi: true,
    },

    // PWA update banner — listens for ngsw VERSION_READY and offers Actualizar.
    // No-op in dev (SwUpdate.isEnabled === false). Mirrors the listener pattern above.
    {
      provide: APP_INITIALIZER,
      useFactory: (pwaUpdate: PwaUpdateService) => () => pwaUpdate.start(),
      deps: [PwaUpdateService],
      multi: true,
    },

    // Profile repository at root — allows UserPreferencesService to access profile
    // from any feature without coupling training/progress routes to profile.routes.ts.
    // ADR-22 addendum. Dexie loaded lazily on first get() / save() call.
    {
      provide: ProfileRepository,
      useFactory: provideLazyProfileRepository,
      deps: [EnvironmentInjector],
    },

    // Dev-only demo seeder — never loaded in production.
    // Dynamic import keeps @core/dev/dev-seed AND ForgeDatabaseService out of the prod bundle entirely.
    {
      provide: APP_INITIALIZER,
      useFactory: (envInjector: EnvironmentInjector) => async (): Promise<void> => {
        if (isDevMode() && new URLSearchParams(window.location.search).get('seed') === 'demo') {
          const [{ seedDemoData }, { ForgeDatabaseService }] = await Promise.all([
            import('@core/dev/dev-seed'),
            import('@core/db/forge-database.service'),
          ]);
          const db = runInInjectionContext(envInjector, () => envInjector.get(ForgeDatabaseService));
          await seedDemoData(db);
          window.history.replaceState({}, '', window.location.pathname);
        }
      },
      deps: [EnvironmentInjector],
      multi: true,
    },
  ],
};
