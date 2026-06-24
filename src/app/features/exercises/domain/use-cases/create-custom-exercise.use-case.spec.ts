import { TestBed } from '@angular/core/testing';
import { CreateCustomExerciseUseCase } from './create-custom-exercise.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { DuplicateExerciseNameError } from '../errors/duplicate-exercise-name.error';
import { ExerciseNameRequiredError } from '../errors/exercise-name-required.error';

// jsdom doesn't implement crypto.randomUUID — mock it globally.
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
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CreateCustomExerciseUseCase', () => {
  let useCase: CreateCustomExerciseUseCase;
  let repo: InMemoryExerciseRepository;

  beforeEach(() => {
    repo = new InMemoryExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        CreateCustomExerciseUseCase,
        { provide: ExerciseRepository, useValue: repo },
      ],
    });

    useCase = TestBed.inject(CreateCustomExerciseUseCase);
  });

  it('should save exercise with isCustom: true when name is unique (D-19/S1)', async () => {
    await useCase.execute({
      name: 'Curl',
      muscleGroup: 'biceps',
      trackingType: 'weight-reps',
    });

    expect(repo.savedExercises).toHaveLength(1);
    expect(repo.savedExercises[0]!.isCustom).toBe(true);
    expect(repo.savedExercises[0]!.name).toBe('Curl');
  });

  it('should throw DuplicateExerciseNameError when name already exists (case-insensitive) (D-19/S2)', async () => {
    repo.setExercises([makeExercise({ name: 'curl', id: 'ex-existing' })]);

    await expect(
      useCase.execute({ name: 'CURL', muscleGroup: 'biceps', trackingType: 'weight-reps' }),
    ).rejects.toThrow(DuplicateExerciseNameError);

    expect(repo.savedExercises).toHaveLength(0);
  });

  it('should throw ExerciseNameRequiredError when name is empty (D-19/S3)', async () => {
    await expect(
      useCase.execute({ name: '', muscleGroup: 'biceps', trackingType: 'weight-reps' }),
    ).rejects.toThrow(ExerciseNameRequiredError);

    expect(repo.savedExercises).toHaveLength(0);
  });

  it('should throw DuplicateExerciseNameError when name matches after trim', async () => {
    repo.setExercises([makeExercise({ name: 'Curl', id: 'ex-existing' })]);

    await expect(
      useCase.execute({ name: '  curl  ', muscleGroup: 'biceps', trackingType: 'weight-reps' }),
    ).rejects.toThrow(DuplicateExerciseNameError);
  });

  it('should set muscleGroup and trackingType from input', async () => {
    await useCase.execute({
      name: 'My Exercise',
      muscleGroup: 'legs',
      trackingType: 'bodyweight-reps',
    });

    expect(repo.savedExercises[0]!.muscleGroup).toBe('legs');
    expect(repo.savedExercises[0]!.trackingType).toBe('bodyweight-reps');
  });

  it('should set optional equipment when provided', async () => {
    await useCase.execute({
      name: 'Cable Curl',
      muscleGroup: 'biceps',
      trackingType: 'weight-reps',
      equipment: 'cable',
    });

    expect(repo.savedExercises[0]!.equipment).toBe('cable');
  });

  it('should return the created exercise with its generated id (D-19/S6)', async () => {
    const result = await useCase.execute({
      name: 'Push Up',
      muscleGroup: 'chest',
      trackingType: 'bodyweight-reps',
    });

    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
    expect(result.name).toBe('Push Up');
    expect(result.isCustom).toBe(true);
    expect(repo.savedExercises[0]!.id).toBe(result.id);
  });

  // ── Slice A: weightUnit ────────────────────────────────────────────────────

  it('defaults weightUnit to "kg" when not provided', async () => {
    await useCase.execute({ name: 'Sentadilla', muscleGroup: 'legs', trackingType: 'weight-reps' });
    expect(repo.savedExercises[0]!.weightUnit).toBe('kg');
  });

  it('saves weightUnit="plates" when provided', async () => {
    await useCase.execute({
      name: 'Prensa máquina',
      muscleGroup: 'legs',
      trackingType: 'weight-reps',
      weightUnit: 'plates',
    });
    expect(repo.savedExercises[0]!.weightUnit).toBe('plates');
  });

  it('saves weightUnit="kg" explicitly when provided', async () => {
    await useCase.execute({
      name: 'Curl bíceps',
      muscleGroup: 'biceps',
      trackingType: 'weight-reps',
      weightUnit: 'kg',
    });
    expect(repo.savedExercises[0]!.weightUnit).toBe('kg');
  });
});
