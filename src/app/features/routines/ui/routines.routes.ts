import { Routes } from '@angular/router';
import { RoutineRepository } from '../domain/routine.repository';
import { DexieRoutineRepository } from '../data/dexie-routine.repository';
import { TrainingDayRepository } from '../domain/training-day.repository';
import { DexieTrainingDayRepository } from '../data/dexie-training-day.repository';

export default [
  {
    path: '',
    providers: [
      { provide: RoutineRepository, useClass: DexieRoutineRepository },
      { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/routine-list.page').then(m => m.RoutineListPage),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/routine-editor.page').then(m => m.RoutineEditorPage),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/routine-editor.page').then(m => m.RoutineEditorPage),
      },
      {
        path: ':routineId/days/:dayId',
        loadComponent: () =>
          import('./pages/training-day-editor.page').then(m => m.TrainingDayEditorPage),
      },
      {
        path: ':routineId/days/:dayId/pick-exercise',
        loadComponent: () =>
          import('./pages/exercise-picker.page').then(m => m.ExercisePickerPage),
      },
    ],
  },
] satisfies Routes;
