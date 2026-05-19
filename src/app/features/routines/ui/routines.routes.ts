import { Routes } from '@angular/router';
import { RoutineRepository } from '../domain/routine.repository';
import { DexieRoutineRepository } from '../data/dexie-routine.repository';
import { TrainingDayRepository } from '../domain/training-day.repository';
import { DexieTrainingDayRepository } from '../data/dexie-training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { DexieExerciseRepository } from '@features/exercises/data/dexie-exercise.repository';

export default [
  {
    path: '',
    providers: [
      { provide: RoutineRepository, useClass: DexieRoutineRepository },
      { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
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
      {
        path: ':routineId/schedule',
        loadComponent: () =>
          import('./pages/weekly-schedule-editor.page').then(m => m.WeeklyScheduleEditorPage),
      },
    ],
  },
] satisfies Routes;
