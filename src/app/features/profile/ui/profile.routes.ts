import { Routes } from '@angular/router';
import { ProfileRepository } from '../domain/profile.repository';
import { DexieProfileRepository } from '../data/dexie-profile.repository';
import { GetUserProfileUseCase } from '../domain/use-cases/get-user-profile.use-case';
import { SetUserProfileUseCase } from '../domain/use-cases/set-user-profile.use-case';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile.page').then((m) => m.ProfilePage),
    providers: [
      { provide: ProfileRepository, useClass: DexieProfileRepository },
      GetUserProfileUseCase,
      SetUserProfileUseCase,
    ],
  },
];
