import { Routes } from '@angular/router';
import { ExerciseRepository } from '../domain/exercise.repository';
import { DexieExerciseRepository } from '../data/dexie-exercise.repository';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/exercise-list.page').then((m) => m.ExerciseListPage),
    providers: [
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
    ],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/exercise-form.page').then((m) => m.ExerciseFormPage),
    providers: [
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
    ],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/exercise-form.page').then((m) => m.ExerciseFormPage),
    providers: [
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
    ],
  },
] satisfies Routes;
