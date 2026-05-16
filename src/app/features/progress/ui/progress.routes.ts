import { Routes } from '@angular/router';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { DexiePersonalRecordRepository } from '../data/repositories/dexie-personal-record.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import { DexieSessionRepository } from '@features/training/data/dexie-session.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { DexieExerciseRepository } from '@features/exercises/data/dexie-exercise.repository';

// Progress no usa Store (per D-31 design decision): las pages son read-only y
// manejan su estado con signals locales de página. ADR-8 reserva NgRx Store
// exclusivamente para el flujo de entrenamiento activo (training feature).
// Si buscás ProgressStore, no existe — es intencional.
export const PROGRESS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: PersonalRecordRepository, useClass: DexiePersonalRecordRepository },
      { provide: SessionRepository, useClass: DexieSessionRepository },
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/progress-home.page').then((m) => m.ProgressHomePage),
      },
      {
        path: 'prs',
        loadComponent: () =>
          import('./pages/pr-list.page').then((m) => m.PRListPage),
      },
      {
        path: 'exercise/:exerciseId',
        loadComponent: () =>
          import('./pages/exercise-history.page').then((m) => m.ExerciseHistoryPage),
      },
    ],
  },
];
