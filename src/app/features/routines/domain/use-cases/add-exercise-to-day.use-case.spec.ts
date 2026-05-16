import { TestBed } from '@angular/core/testing';
import { AddExerciseToDayUseCase } from './add-exercise-to-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_id: string): Promise<TrainingDay[]> { return []; }

  override async save(day: TrainingDay): Promise<void> {
    const idx = this.days.findIndex(d => d.id === day.id);
    if (idx >= 0) this.days[idx] = day;
    else this.days.push(day);
  }

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

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'ex1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AddExerciseToDayUseCase', () => {
  let useCase: AddExerciseToDayUseCase;
  let dayRepo: StubTrainingDayRepository;
  let exerciseRepo: StubExerciseRepository;

  beforeEach(() => {
    dayRepo = new StubTrainingDayRepository();
    exerciseRepo = new StubExerciseRepository();
    TestBed.configureTestingModule({
      providers: [
        AddExerciseToDayUseCase,
        { provide: TrainingDayRepository, useValue: dayRepo },
        { provide: ExerciseRepository, useValue: exerciseRepo },
      ],
    });
    useCase = TestBed.inject(AddExerciseToDayUseCase);
  });

  it('should append ExerciseInDay to training day with order = exercises.length', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(updated.exercises).toHaveLength(1);
    expect(updated.exercises[0]!.exerciseId).toBe('ex1');
    expect(updated.exercises[0]!.order).toBe(0);
  });

  it('should set order to exercises.length (append at end)', async () => {
    dayRepo.days = [makeDay({
      exercises: [{ exerciseId: 'ex0', order: 0, targetSets: [] }],
    })];
    exerciseRepo.exercises = [makeExercise({ id: 'ex1' })];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(updated.exercises[1]!.order).toBe(1);
  });

  it('should throw ExerciseNotFoundError when exercise does not exist', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [];

    await expect(useCase.execute({ dayId: 'd1', exerciseId: 'nonexistent' }))
      .rejects.toThrow(ExerciseNotFoundError);
  });

  it('should throw when training day not found', async () => {
    exerciseRepo.exercises = [makeExercise()];

    await expect(useCase.execute({ dayId: 'nonexistent', exerciseId: 'ex1' }))
      .rejects.toThrow();
  });

  it('should persist changes via repo.save', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise()];
    const spy = jest.spyOn(dayRepo, 'save');

    await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should initialize targetSets as empty array', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(updated.exercises[0]!.targetSets).toHaveLength(0);
  });
});
