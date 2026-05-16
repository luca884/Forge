import { Routes } from '@angular/router';
import { SessionRepository } from '../domain/session.repository';
import { DexieSessionRepository } from '../data/dexie-session.repository';
import { RoutineRepository } from '../../routines/domain/routine.repository';
import { DexieRoutineRepository } from '../../routines/data/dexie-routine.repository';
import { TrainingDayRepository } from '../../routines/domain/training-day.repository';
import { DexieTrainingDayRepository } from '../../routines/data/dexie-training-day.repository';
import { ExerciseRepository } from '../../exercises/domain/exercise.repository';
import { DexieExerciseRepository } from '../../exercises/data/dexie-exercise.repository';
import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import { PersonalRecordDetector } from '../domain/services/personal-record-detector';
import { TrainingSessionStore } from './services/training-session.store';
import { RestTimerService } from './services/rest-timer.service';

export default [
  {
    path: '',
    providers: [
      { provide: SessionRepository, useClass: DexieSessionRepository },
      { provide: RoutineRepository, useClass: DexieRoutineRepository },
      { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
      { provide: EventBus, useClass: InMemoryEventBus },
      PersonalRecordDetector,
      TrainingSessionStore,
      RestTimerService,
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/training-home.page').then(m => m.TrainingHomePage),
      },
      {
        path: 'session',
        loadComponent: () =>
          import('./pages/training-session.page').then(m => m.TrainingSessionPage),
      },
      {
        path: 'session/summary',
        loadComponent: () =>
          import('./pages/session-summary.page').then(m => m.SessionSummaryPage),
      },
    ],
  },
] satisfies Routes;
