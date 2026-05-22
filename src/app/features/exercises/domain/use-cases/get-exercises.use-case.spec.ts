import { TestBed } from '@angular/core/testing';
import { GetExercisesUseCase } from './get-exercises.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

class StubExerciseRepository extends ExerciseRepository {
  private exercises: Exercise[] = [];
  private capturedFilter: ExerciseFilter | undefined;

  setExercises(exercises: Exercise[]): void {
    this.exercises = exercises;
  }

  getCapturedFilter(): ExerciseFilter | undefined {
    return this.capturedFilter;
  }

  override getAll(filter?: ExerciseFilter): Promise<Exercise[]> {
    this.capturedFilter = filter;
    return Promise.resolve(this.exercises);
  }

  override getById(_id: string): Promise<Exercise | null> {
    return Promise.resolve(null);
  }

  override save(_exercise: Exercise): Promise<void> {
    return Promise.resolve();
  }

  override count(): Promise<number> {
    return Promise.resolve(this.exercises.length);
  }

  override delete(_id: string): Promise<void> {
    return Promise.resolve();
  }
}

describe('GetExercisesUseCase', () => {
  let useCase: GetExercisesUseCase;
  let stub: StubExerciseRepository;

  beforeEach(() => {
    stub = new StubExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        GetExercisesUseCase,
        { provide: ExerciseRepository, useValue: stub },
      ],
    });

    useCase = TestBed.inject(GetExercisesUseCase);
  });

  it('should return all exercises when called with no filter (S1)', async () => {
    const exercises = [
      makeExercise({ id: 'ex-1' }),
      makeExercise({ id: 'ex-2' }),
      makeExercise({ id: 'ex-3' }),
      makeExercise({ id: 'ex-4' }),
      makeExercise({ id: 'ex-5' }),
    ];
    stub.setExercises(exercises);

    const result = await useCase.execute();

    expect(result).toEqual(exercises);
    expect(result.length).toBe(5);
  });

  it('should pass filter to repository.getAll (S2)', async () => {
    stub.setExercises([]);
    const filter: ExerciseFilter = { muscleGroup: 'chest' };

    await useCase.execute(filter);

    expect(stub.getCapturedFilter()).toEqual(filter);
  });

  it('returns exercises sorted alphabetically by name (N-1)', async () => {
    stub.setExercises([
      makeExercise({ id: '1', name: 'Sentadilla' }),
      makeExercise({ id: '2', name: 'Aperturas con mancuernas' }),
      makeExercise({ id: '3', name: 'Press de banca' }),
      makeExercise({ id: '4', name: 'Curl de bíceps' }),
    ]);

    const result = await useCase.execute();

    expect(result.map((e) => e.name)).toEqual([
      'Aperturas con mancuernas',
      'Curl de bíceps',
      'Press de banca',
      'Sentadilla',
    ]);
  });
});
