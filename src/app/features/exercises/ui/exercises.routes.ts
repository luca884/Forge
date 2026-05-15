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
] satisfies Routes;
