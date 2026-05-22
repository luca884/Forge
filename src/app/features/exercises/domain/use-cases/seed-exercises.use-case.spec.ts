import { TestBed } from '@angular/core/testing';
import { SeedExercisesUseCase } from './seed-exercises.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';

// jsdom doesn't implement crypto.randomUUID — mock it globally for this spec.
beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => `test-uuid-${++counter}-0000-0000-0000-000000000000`,
    writable: true,
    configurable: true,
  });
});

class InMemoryExerciseRepository extends ExerciseRepository {
  private exercises: Exercise[] = [];
  public saveCallCount = 0;

  override getAll(_filter?: ExerciseFilter): Promise<Exercise[]> {
    return Promise.resolve([...this.exercises]);
  }

  override getById(_id: string): Promise<Exercise | null> {
    return Promise.resolve(null);
  }

  override save(exercise: Exercise): Promise<void> {
    this.saveCallCount++;
    const existing = this.exercises.findIndex((e) => e.id === exercise.id);
    if (existing >= 0) {
      this.exercises[existing] = exercise;
    } else {
      this.exercises.push(exercise);
    }
    return Promise.resolve();
  }

  override count(): Promise<number> {
    return Promise.resolve(this.exercises.length);
  }

  override delete(_id: string): Promise<void> {
    return Promise.resolve();
  }
}

describe('SeedExercisesUseCase', () => {
  let useCase: SeedExercisesUseCase;
  let repo: InMemoryExerciseRepository;

  beforeEach(() => {
    repo = new InMemoryExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        SeedExercisesUseCase,
        { provide: ExerciseRepository, useValue: repo },
      ],
    });

    useCase = TestBed.inject(SeedExercisesUseCase);
  });

  it('should call save at least 12 times when repo is empty (S1)', async () => {
    await useCase.execute();

    expect(repo.saveCallCount).toBeGreaterThanOrEqual(12);
  });

  it('should never call save when repo already has exercises (S2 / V-24)', async () => {
    // Pre-populate with 15 exercises
    repo['exercises'] = Array.from({ length: 15 }, (_, i) => ({
      id: `pre-${i}`,
      name: `Pre Exercise ${i}`,
      muscleGroup: 'chest',
      trackingType: 'weight-reps',
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await useCase.execute();

    expect(repo.saveCallCount).toBe(0);
  });

  it('should be idempotent — calling twice on empty repo yields same count (S3)', async () => {
    await useCase.execute();
    const countAfterFirst = await repo.count();

    await useCase.execute();
    const countAfterSecond = await repo.count();

    expect(countAfterFirst).toBe(countAfterSecond);
    expect(countAfterFirst).toBeGreaterThanOrEqual(12);
  });

  it('should seed at least one exercise for every muscle group (catalog coverage)', async () => {
    await useCase.execute();
    const all = await repo.getAll();
    const groups = new Set(all.map((e) => e.muscleGroup));

    const expected: ReadonlyArray<Exercise['muscleGroup']> = [
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'legs', 'glutes', 'core', 'full-body',
    ];
    for (const group of expected) {
      expect(groups.has(group)).toBe(true);
    }
  });
});
