import { Routes } from '@angular/router';
import { SetPreferredUnitUseCase } from '../domain/use-cases/set-preferred-unit.use-case';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile.page').then((m) => m.ProfilePage),
    providers: [SetPreferredUnitUseCase],
  },
];
