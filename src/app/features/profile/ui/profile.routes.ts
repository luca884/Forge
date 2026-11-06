import { Routes } from '@angular/router';
import { SetPreferredUnitUseCase } from '../domain/use-cases/set-preferred-unit.use-case';
import { ExportHistoryCsvUseCase } from '@features/progress/domain/use-cases/export-history-csv.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { DexieSessionRepository } from '@features/training/data/dexie-session.repository';
import { RoutineRepository } from '@features/routines/domain/routine.repository';
import { DexieRoutineRepository } from '@features/routines/data/dexie-routine.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { DexieTrainingDayRepository } from '@features/routines/data/dexie-training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { DexieExerciseRepository } from '@features/exercises/data/dexie-exercise.repository';
import { ExportBackupUseCase, RestoreBackupUseCase } from '@core/shared/domain/use-cases/backup.use-cases';
import { BackupStore } from '@core/shared/domain/backup/backup-store';
import { DexieBackupStore } from '@core/shared/data/dexie-backup-store';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile.page').then((m) => m.ProfilePage),
    providers: [
      SetPreferredUnitUseCase,
      // "Exportar historial (CSV)" reads sessions, routines, days and exercises (read-only).
      ExportHistoryCsvUseCase,
      { provide: SessionRepository, useClass: DexieSessionRepository },
      { provide: RoutineRepository, useClass: DexieRoutineRepository },
      { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
      { provide: ExerciseRepository, useClass: DexieExerciseRepository },
      // "Exportar respaldo" / "Restaurar respaldo" read and replace every table at once.
      ExportBackupUseCase,
      RestoreBackupUseCase,
      { provide: BackupStore, useClass: DexieBackupStore },
    ],
  },
];
