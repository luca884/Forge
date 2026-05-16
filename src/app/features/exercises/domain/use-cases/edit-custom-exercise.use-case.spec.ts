import { TestBed } from '@angular/core/testing';
import { EditCustomExerciseUseCase } from './edit-custom-exercise.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotEditBuiltInExerciseError } from '../errors/cannot-edit-built-in-exercise.error';
import { DuplicateExerciseNameError } from '../errors/duplicate-exercise-name.error';

class InMemoryExerciseRepository extends ExerciseRepository {
  private exercises: Exercise[] = [];
  public savedExercises: Exercise[] = [];

  setExercises(exercises: Exercise[]): void {
    this.exercises = [...exercises];
  }

  override async getAll(_filter?: ExerciseFilter): Promise<Exercise[]> {
    return [...this.exercises];
  }

  override async getById(id: string): Promise<Exercise | null> {
    return this.exercises.find((e) => e.id === id) ?? null;
  }

  override async save(exercise: Exercise): Promise<void> {
    this.savedExercises.push(exercise);
    const idx = this.exercises.findIndex((e) => e.id === exercise.id);
    if (idx >= 0) {
      this.exercises[idx] = exercise;
    } else {
      this.exercises.push(exercise);
    }
  }

  override async count(): Promise<number> {
    return this.exercises.length;
  }

  override async delete(_id: string): Promise<void> {}
}

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('EditCustomExerciseUseCase', () => {
  let useCase: EditCustomExerciseUseCase;
  let repo: InMemoryExerciseRepository;

  beforeEach(() => {
    repo = new InMemoryExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        EditCustomExerciseUseCase,
        { provide: ExerciseRepository, useValue: repo },
      ],
    });

    useCase = TestBed.inject(EditCustomExerciseUseCase);
  });

  it('should update exercise name for a custom exercise (D-20/S1)', async () => {
    repo.setExercises([makeExercise({ id: 'ex-1', name: 'Bench Press', isCustom: true })]);

    await useCase.execute({ id: 'ex-1', name: 'New Name' });

    expect(repo.savedExercises[0]!.name).toBe('New Name');
    expect(repo.savedExercises[0]!.id).toBe('ex-1');
  });

  it('should throw CannotEditBuiltInExerciseError for seed exercise (isCustom: false) (D-20/S2)', async () => {
    repo.setExercises([makeExercise({ id: 'seed-1', name: 'Squat', isCustom: false })]);

    await expect(
      useCase.execute({ id: 'seed-1', name: 'Updated' }),
    ).rejects.toThrow(CannotEditBuiltInExerciseError);

    expect(repo.savedExercises).toHaveLength(0);
  });

  it('should throw ExerciseNotFoundError when exercise not found (D-20/S3)', async () => {
    await expect(
      useCase.execute({ id: 'nonexistent' }),
    ).rejects.toThrow(ExerciseNotFoundError);
  });

  it('should throw DuplicateExerciseNameError when new name duplicates another exercise (case-insensitive)', async () => {
    repo.setExercises([
      makeExercise({ id: 'ex-1', name: 'My Exercise', isCustom: true }),
      makeExercise({ id: 'ex-2', name: 'Curl', isCustom: false }),
    ]);

    await expect(
      useCase.execute({ id: 'ex-1', name: 'curl' }),
    ).rejects.toThrow(DuplicateExerciseNameError);

    expect(repo.savedExercises).toHaveLength(0);
  });

  it('should allow renaming to same name (skip-self uniqueness)', async () => {
    repo.setExercises([
      makeExercise({ id: 'ex-1', name: 'My Exercise', isCustom: true }),
    ]);

    await expect(
      useCase.execute({ id: 'ex-1', name: 'My Exercise' }),
    ).resolves.toBeUndefined();

    expect(repo.savedExercises).toHaveLength(1);
  });

  it('should preserve fields not included in input', async () => {
    repo.setExercises([
      makeExercise({ id: 'ex-1', name: 'Bench Press', muscleGroup: 'chest', isCustom: true }),
    ]);

    await useCase.execute({ id: 'ex-1', muscleGroup: 'back' });

    expect(repo.savedExercises[0]!.name).toBe('Bench Press');
    expect(repo.savedExercises[0]!.muscleGroup).toBe('back');
  });

  it('should update updatedAt timestamp on save', async () => {
    const originalDate = new Date('2024-01-01');
    repo.setExercises([
      makeExercise({ id: 'ex-1', isCustom: true, updatedAt: originalDate }),
    ]);

    await useCase.execute({ id: 'ex-1', name: 'Updated Name' });

    expect(repo.savedExercises[0]!.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
  });
});
