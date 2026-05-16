import { TestBed } from '@angular/core/testing';
import { DeleteCustomExerciseUseCase } from './delete-custom-exercise.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotDeleteBuiltInExerciseError } from '../errors/cannot-delete-built-in-exercise.error';

class InMemoryExerciseRepository extends ExerciseRepository {
  private exercises: Exercise[] = [];
  public deletedIds: string[] = [];

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

  override async delete(id: string): Promise<void> {
    this.deletedIds.push(id);
    this.exercises = this.exercises.filter((e) => e.id !== id);
  }
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

describe('DeleteCustomExerciseUseCase', () => {
  let useCase: DeleteCustomExerciseUseCase;
  let repo: InMemoryExerciseRepository;

  beforeEach(() => {
    repo = new InMemoryExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        DeleteCustomExerciseUseCase,
        { provide: ExerciseRepository, useValue: repo },
      ],
    });

    useCase = TestBed.inject(DeleteCustomExerciseUseCase);
  });

  it('should call exerciseRepo.delete for a custom exercise (D-21/S1)', async () => {
    repo.setExercises([makeExercise({ id: 'custom-1', isCustom: true })]);

    await useCase.execute({ id: 'custom-1' });

    expect(repo.deletedIds).toContain('custom-1');
  });

  it('should throw CannotDeleteBuiltInExerciseError for seed exercise (isCustom: false) and NOT call delete (D-21/S2)', async () => {
    repo.setExercises([makeExercise({ id: 'seed-1', isCustom: false })]);

    await expect(
      useCase.execute({ id: 'seed-1' }),
    ).rejects.toThrow(CannotDeleteBuiltInExerciseError);

    expect(repo.deletedIds).toHaveLength(0);
  });

  it('should throw ExerciseNotFoundError when exercise not found (D-21/S3)', async () => {
    await expect(
      useCase.execute({ id: 'ghost' }),
    ).rejects.toThrow(ExerciseNotFoundError);

    expect(repo.deletedIds).toHaveLength(0);
  });

  it('should NOT touch workedSets or any other entity (D-21/R7 orphan policy)', async () => {
    // The use case only calls delete() on the exercise repo.
    // This test verifies only one delete call is made and nothing else.
    repo.setExercises([makeExercise({ id: 'custom-2', isCustom: true })]);

    await useCase.execute({ id: 'custom-2' });

    expect(repo.deletedIds).toEqual(['custom-2']);
  });
});
