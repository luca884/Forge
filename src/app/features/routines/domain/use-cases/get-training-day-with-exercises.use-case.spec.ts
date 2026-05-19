import { TestBed } from '@angular/core/testing';
import {
  GetTrainingDayWithExercisesUseCase,
  type TrainingDayView,
} from './get-training-day-with-exercises.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { TrainingDay } from '../training-day.entity';
import { Exercise } from '@features/exercises/domain/exercise.entity';

// ---- Stubs ----

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_id: string): Promise<TrainingDay[]> { return []; }

  override async save(_day: TrainingDay): Promise<void> {}

  override async delete(_id: string): Promise<void> {}
}

class StubExerciseRepository extends ExerciseRepository {
  exercises: Exercise[] = [];

  override async getAll(): Promise<Exercise[]> { return this.exercises; }

  override async getById(id: string): Promise<Exercise | null> {
    return this.exercises.find(e => e.id === id) ?? null;
  }

  override async save(_exercise: Exercise): Promise<void> {}
  override async count(): Promise<number> { return this.exercises.length; }
  override async delete(_id: string): Promise<void> {}
}

// ---- Factories ----

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'd-1',
  routineId: 'r-1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeExercise = (id: string, name: string): Exercise => ({
  id,
  name,
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ---- Tests ----

describe('GetTrainingDayWithExercisesUseCase', () => {
  let useCase: GetTrainingDayWithExercisesUseCase;
  let dayRepo: StubTrainingDayRepository;
  let exerciseRepo: StubExerciseRepository;

  beforeEach(() => {
    dayRepo = new StubTrainingDayRepository();
    exerciseRepo = new StubExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        GetTrainingDayWithExercisesUseCase,
        { provide: TrainingDayRepository, useValue: dayRepo },
        { provide: ExerciseRepository, useValue: exerciseRepo },
      ],
    });

    useCase = TestBed.inject(GetTrainingDayWithExercisesUseCase);
  });

  it('returns null when training day not found and does NOT call getAll()', async () => {
    const getAllSpy = jest.spyOn(exerciseRepo, 'getAll');

    const result = await useCase.execute({ trainingDayId: 'nonexistent' });

    expect(result).toBeNull();
    expect(getAllSpy).not.toHaveBeenCalled();
  });

  it('returns enriched view with exercise names when all exercises are resolvable', async () => {
    dayRepo.days = [
      makeDay({
        exercises: [
          { exerciseId: 'ex-a', order: 0, targetSets: [] },
          { exerciseId: 'ex-b', order: 1, targetSets: [] },
        ],
      }),
    ];
    exerciseRepo.exercises = [
      makeExercise('ex-a', 'Bench Press'),
      makeExercise('ex-b', 'Squat'),
    ];

    const result = await useCase.execute({ trainingDayId: 'd-1' });

    expect(result).not.toBeNull();
    const view = result as TrainingDayView;
    expect(view.exercises[0]!.exerciseName).toBe('Bench Press');
    expect(view.exercises[1]!.exerciseName).toBe('Squat');
  });

  it('falls back to "[Ejercicio eliminado]" for exerciseId not in catalog', async () => {
    dayRepo.days = [
      makeDay({
        exercises: [
          { exerciseId: 'ex-a', order: 0, targetSets: [] },
          { exerciseId: 'ex-deleted', order: 1, targetSets: [] },
        ],
      }),
    ];
    exerciseRepo.exercises = [makeExercise('ex-a', 'Bench Press')];

    const result = await useCase.execute({ trainingDayId: 'd-1' });

    expect(result).not.toBeNull();
    const view = result as TrainingDayView;
    expect(view.exercises[0]!.exerciseName).toBe('Bench Press');
    expect(view.exercises[1]!.exerciseName).toBe('[Ejercicio eliminado]');
  });

  it('preserves order, targetSets, restSeconds, note from the original entity', async () => {
    dayRepo.days = [
      makeDay({
        exercises: [
          {
            exerciseId: 'ex-a',
            order: 3,
            targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 80 }],
            restSeconds: 90,
            note: 'Foco en técnica',
          },
        ],
      }),
    ];
    exerciseRepo.exercises = [makeExercise('ex-a', 'Bench Press')];

    const result = await useCase.execute({ trainingDayId: 'd-1' });

    expect(result).not.toBeNull();
    const ex = (result as TrainingDayView).exercises[0]!;
    expect(ex.order).toBe(3);
    expect(ex.targetSets).toHaveLength(1);
    expect(ex.restSeconds).toBe(90);
    expect(ex.note).toBe('Foco en técnica');
  });

  it('handles empty exercises array and returns TrainingDayView with empty exercises', async () => {
    dayRepo.days = [makeDay({ exercises: [] })];
    exerciseRepo.exercises = [makeExercise('ex-a', 'Bench Press')];

    const result = await useCase.execute({ trainingDayId: 'd-1' });

    expect(result).not.toBeNull();
    expect((result as TrainingDayView).exercises).toHaveLength(0);
  });

  it('returns "[Ejercicio eliminado]" for all exercises when catalog is empty', async () => {
    dayRepo.days = [
      makeDay({
        exercises: [
          { exerciseId: 'ex-a', order: 0, targetSets: [] },
          { exerciseId: 'ex-b', order: 1, targetSets: [] },
        ],
      }),
    ];
    exerciseRepo.exercises = [];

    const result = await useCase.execute({ trainingDayId: 'd-1' });

    expect(result).not.toBeNull();
    const view = result as TrainingDayView;
    expect(view.exercises[0]!.exerciseName).toBe('[Ejercicio eliminado]');
    expect(view.exercises[1]!.exerciseName).toBe('[Ejercicio eliminado]');
  });
});
