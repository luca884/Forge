import { Routes } from '@angular/router';
import { ExerciseRepository } from '../domain/exercise.repository';
import { DexieExerciseRepository } from '../data/dexie-exercise.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import { DexieSessionRepository } from '@features/training/data/dexie-session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { DexiePersonalRecordRepository } from '@features/progress/data/repositories/dexie-personal-record.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { DexieTrainingDayRepository } from '@features/routines/data/dexie-training-day.repository';

const sharedProviders = [
  { provide: ExerciseRepository, useClass: DexieExerciseRepository },
  { provide: SessionRepository, useClass: DexieSessionRepository },
  { provide: PersonalRecordRepository, useClass: DexiePersonalRecordRepository },
  { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
];

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/exercise-list.page').then((m) => m.ExerciseListPage),
    providers: sharedProviders,
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/exercise-form.page').then((m) => m.ExerciseFormPage),
    providers: sharedProviders,
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/exercise-form.page').then((m) => m.ExerciseFormPage),
    providers: sharedProviders,
  },
] satisfies Routes;
