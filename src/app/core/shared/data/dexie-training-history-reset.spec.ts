/**
 * dexie-training-history-reset.spec.ts
 * TDD strict — RED written before implementation.
 * Uses fake-indexeddb (registered globally in setup-jest.ts).
 * NO jest.mock of Dexie internals.
 *
 * Critical assertion: the 6 history tables are cleared;
 * `profile` and `exercises` are preserved intact.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { TrainingHistoryReset } from '../domain/training-history-reset';
import { DexieTrainingHistoryReset } from './dexie-training-history-reset';
import type { ProfileRow, ExerciseRow } from '@core/db/database';

describe('DexieTrainingHistoryReset', () => {
  let impl: DexieTrainingHistoryReset;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        { provide: TrainingHistoryReset, useClass: DexieTrainingHistoryReset },
        DexieTrainingHistoryReset,
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    impl = TestBed.inject(DexieTrainingHistoryReset);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  describe('clear()', () => {
    it('clears all 6 history tables and leaves profile + exercises intact', async () => {
      // Seed profile
      const profile: ProfileRow = {
        id: 'me',
        name: 'Luca',
        preferredUnit: 'kg',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      await db.profile.put(profile);

      // Seed exercise
      const exercise: ExerciseRow = {
        id: 'ex-1',
        name: 'Sentadilla',
        muscleGroup: 'legs',
        trackingType: 'weight-reps',
        isCustom: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      await db.exercises.put(exercise);

      // Seed one row in each of the 6 history tables
      await db.routines.put({
        id: 'r-1',
        name: 'Rutina A',
        isActive: true,
        schedule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.trainingDays.put({
        id: 'td-1',
        routineId: 'r-1',
        name: 'Día 1',
        exercises: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.sessions.put({
        id: 'sess-1',
        routineId: 'r-1',
        dayId: 'td-1',
        date: '2026-01-01',
        startedAt: new Date(),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.workedSets.put({
        id: 'ws-1',
        sessionId: 'sess-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        isPR: false,
        createdAt: new Date(),
      });

      await db.personalRecords.put({
        id: 'pr-1',
        exerciseId: 'ex-1',
        trackingType: 'weight-reps',
        workedSetId: 'ws-1',
        achievedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.auditEvents.put({
        id: 'ae-1',
        name: 'WorkedSetEdited',
        occurredAt: new Date(),
        payload: '{}',
      });

      // Act
      await impl.clear();

      // Assert: 6 history tables are empty
      expect(await db.routines.count()).toBe(0);
      expect(await db.trainingDays.count()).toBe(0);
      expect(await db.sessions.count()).toBe(0);
      expect(await db.workedSets.count()).toBe(0);
      expect(await db.personalRecords.count()).toBe(0);
      expect(await db.auditEvents.count()).toBe(0);

      // Assert: profile and exercises are intact
      expect(await db.profile.count()).toBe(1);
      expect(await db.exercises.count()).toBe(1);

      const savedProfile = await db.profile.get('me');
      expect(savedProfile?.name).toBe('Luca');

      const savedExercise = await db.exercises.get('ex-1');
      expect(savedExercise?.name).toBe('Sentadilla');
    });

    it('is idempotent: clear() on empty DB does not throw', async () => {
      await expect(impl.clear()).resolves.toBeUndefined();
    });
  });
});
