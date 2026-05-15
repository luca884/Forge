import { TestBed } from '@angular/core/testing';
import { DexieExerciseRepository } from './dexie-exercise.repository';
import { ExerciseRepository } from '../domain/exercise.repository';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { Exercise } from '../domain/exercise.entity';

// fake-indexeddb/auto is registered in setup-jest.ts — no jest.mock for Dexie.

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('DexieExerciseRepository', () => {
  let repo: ExerciseRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        { provide: ExerciseRepository, useClass: DexieExerciseRepository },
      ],
    });

    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(ExerciseRepository);

    // Clear the exercises table before each test
    await db.exercises.clear();
  });

  afterEach(async () => {
    await db.exercises.clear();
  });

  it('should save an exercise and retrieve it via getAll (S1)', async () => {
    const exercise = makeExercise({ id: 'ex-s1' });
    await repo.save(exercise);

    const results = await repo.getAll();

    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe('ex-s1');
    expect(results[0]?.name).toBe('Bench Press');
  });

  it('should filter by muscleGroup (S2)', async () => {
    await repo.save(makeExercise({ id: 'ex-chest-1', muscleGroup: 'chest' }));
    await repo.save(makeExercise({ id: 'ex-chest-2', muscleGroup: 'chest' }));
    await repo.save(makeExercise({ id: 'ex-chest-3', muscleGroup: 'chest' }));
    await repo.save(makeExercise({ id: 'ex-back-1', muscleGroup: 'back' }));
    await repo.save(makeExercise({ id: 'ex-back-2', muscleGroup: 'back' }));

    const result = await repo.getAll({ muscleGroup: 'chest' });

    expect(result.length).toBe(3);
    expect(result.every((e) => e.muscleGroup === 'chest')).toBe(true);
  });

  it('should upsert — saving same id twice yields one entry (S3)', async () => {
    await repo.save(makeExercise({ id: 'ex-upsert', name: 'Original' }));
    await repo.save(makeExercise({ id: 'ex-upsert', name: 'Updated' }));

    const results = await repo.getAll();

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('Updated');
  });

  it('should return 0 when count is called on empty DB (S4)', async () => {
    const count = await repo.count();
    expect(count).toBe(0);
  });

  it('should filter by search name (case-insensitive)', async () => {
    await repo.save(makeExercise({ id: 'ex-1', name: 'Bench Press' }));
    await repo.save(makeExercise({ id: 'ex-2', name: 'Squat' }));

    const result = await repo.getAll({ search: 'bench' });

    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('Bench Press');
  });

  it('should return null from getById for non-existent id', async () => {
    const result = await repo.getById('non-existent');
    expect(result).toBeNull();
  });

  it('should return exercise from getById', async () => {
    const exercise = makeExercise({ id: 'ex-get' });
    await repo.save(exercise);

    const result = await repo.getById('ex-get');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('ex-get');
  });
});
