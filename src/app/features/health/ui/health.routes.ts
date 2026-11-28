import type { Routes } from '@angular/router';
import { CapacitorHealthSource } from '../data/capacitor-health.source';
import { DexieHealthDayRepository } from '../data/dexie-health-day.repository';
import { HealthDayRepository } from '../domain/health-day.repository';
import { HealthSource } from '../domain/health-source';
import { GetHealthDayUseCase } from '../domain/use-cases/get-health-day.use-case';
import { GetHealthTrendUseCase } from '../domain/use-cases/get-health-trend.use-case';
import { SaveHealthDaysUseCase } from '../domain/use-cases/save-health-days.use-case';
import { SyncHealthUseCase } from '../domain/use-cases/sync-health.use-case';

export default [
  {
    path: '',
    providers: [
      { provide: HealthDayRepository, useClass: DexieHealthDayRepository },
      { provide: HealthSource, useClass: CapacitorHealthSource },
      SaveHealthDaysUseCase,
      GetHealthDayUseCase,
      GetHealthTrendUseCase,
      SyncHealthUseCase,
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/health.page').then((m) => m.HealthPage),
      },
    ],
  },
] satisfies Routes;
