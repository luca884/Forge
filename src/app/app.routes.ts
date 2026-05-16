import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/training',
    pathMatch: 'full',
  },
  {
    path: 'training',
    loadChildren: () =>
      import('@features/training/ui/training.routes').then((m) => m.default),
  },
  {
    path: 'routines',
    loadChildren: () =>
      import('@features/routines/ui/routines.routes').then((m) => m.default),
  },
  {
    path: 'exercises',
    loadChildren: () =>
      import('@features/exercises/ui/exercises.routes').then((m) => m.default),
  },
  {
    path: 'progress',
    loadChildren: () =>
      import('@features/progress/ui/progress.routes').then((m) => m.PROGRESS_ROUTES),
  },
  {
    path: '**',
    redirectTo: '/training',
  },
];
