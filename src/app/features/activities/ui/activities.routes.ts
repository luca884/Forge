import type { Routes } from '@angular/router';
import { DexieActivityRepository } from '../data/dexie-activity.repository';
import { ActivityRepository } from '../domain/activity.repository';
import { DeleteActivityUseCase } from '../domain/use-cases/delete-activity.use-case';
import { GetActivityUseCase } from '../domain/use-cases/get-activity.use-case';
import { ImportActivityUseCase } from '../domain/use-cases/import-activity.use-case';
import { ListActivitiesUseCase } from '../domain/use-cases/list-activities.use-case';

export default [
  {
    path: '',
    providers: [
      { provide: ActivityRepository, useClass: DexieActivityRepository },
      ImportActivityUseCase,
      ListActivitiesUseCase,
      GetActivityUseCase,
      DeleteActivityUseCase,
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/activity-list.page').then((m) => m.ActivityListPage),
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/activity-detail.page').then((m) => m.ActivityDetailPage),
      },
    ],
  },
] satisfies Routes;
