import { TestBed } from '@angular/core/testing';
import { GetExercisesMapUseCase } from './get-exercises-map.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';

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

class StubExerciseRepository extends ExerciseRepository {
  private exercises: Exercise[] = [];
  setExercises(exercises: Exercise[]): void {
    this.exercises = exercises;
  }
  override getAll(_filter?: ExerciseFilter): Promise<Exercise[]> {
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

describe('GetExercisesMapUseCase', () => {
  let useCase: GetExercisesMapUseCase;
  let stub: StubExerciseRepository;

  beforeEach(() => {
    stub = new StubExerciseRepository();
    TestBed.configureTestingModule({
      providers: [
        GetExercisesMapUseCase,
        { provide: ExerciseRepository, useValue: stub },
      ],
    });
    useCase = TestBed.inject(GetExercisesMapUseCase);
  });

  it('devuelve un Map<id, Exercise> con todos los ejercicios', async () => {
    const a = makeExercise({ id: 'ex-1', name: 'Bench' });
    const b = makeExercise({ id: 'ex-2', name: 'Squat' });
    stub.setExercises([a, b]);

    const map = await useCase.execute();

    expect(map.size).toBe(2);
    expect(map.get('ex-1')).toEqual(a);
    expect(map.get('ex-2')).toEqual(b);
  });

  it('permite resolver el nombre por id (consumer name-only)', async () => {
    stub.setExercises([makeExercise({ id: 'ex-9', name: 'Deadlift' })]);

    const map = await useCase.execute();

    expect(map.get('ex-9')?.name).toBe('Deadlift');
    expect(map.get('inexistente')?.name ?? '[Ejercicio eliminado]').toBe(
      '[Ejercicio eliminado]',
    );
  });

  it('devuelve un Map vacío cuando no hay ejercicios', async () => {
    stub.setExercises([]);
    const map = await useCase.execute();
    expect(map.size).toBe(0);
  });
});
