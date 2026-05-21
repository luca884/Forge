import { Routes } from '@angular/router';
import { GetUserProfileUseCase } from '../domain/use-cases/get-user-profile.use-case';
import { SetUserProfileUseCase } from '../domain/use-cases/set-user-profile.use-case';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile.page').then((m) => m.ProfilePage),
    providers: [GetUserProfileUseCase, SetUserProfileUseCase],
  },
];
