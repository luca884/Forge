import { TestBed } from '@angular/core/testing';
import { SetTargetSetsUseCase } from './set-target-sets.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { TrainingDay } from '../training-day.entity';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { TargetSetTypeMismatchError } from '../errors/target-set-type-mismatch.error';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_id: string): Promise<TrainingDay[]> { return []; }

  override async save(day: TrainingDay): Promise<void> {
    const idx = this.days.findIndex(d => d.id === day.id);
    if (idx >= 0) this.days[idx] = day;
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

const makeDay = (): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [{ exerciseId: 'ex1', order: 0, targetSets: [] }],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeExercise = (trackingType: string): Exercise => ({
  id: 'ex1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: trackingType as Exercise['trackingType'],
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SetTargetSetsUseCase', () => {
  let useCase: SetTargetSetsUseCase;
  let dayRepo: StubTrainingDayRepository;
  let exerciseRepo: StubExerciseRepository;

  beforeEach(() => {
    dayRepo = new StubTrainingDayRepository();
    exerciseRepo = new StubExerciseRepository();
    TestBed.configureTestingModule({
      providers: [
        SetTargetSetsUseCase,
        { provide: TrainingDayRepository, useValue: dayRepo },
        { provide: ExerciseRepository, useValue: exerciseRepo },
      ],
    });
    useCase = TestBed.inject(SetTargetSetsUseCase);
  });

  it('should replace targetSets for an exercise in a training day', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise('weight-reps')];

    const updated = await useCase.execute({
      dayId: 'd1',
      exerciseId: 'ex1',
      targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 100 }],
    });

    expect(updated.targetSets).toHaveLength(1);
    expect(updated.targetSets[0]!.type).toBe('weight-reps');
  });

  it('should throw TargetSetTypeMismatchError when type does not match exercise trackingType', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise('weight-reps')];

    await expect(
      useCase.execute({
        dayId: 'd1',
        exerciseId: 'ex1',
        targetSets: [{ type: 'bodyweight-reps', reps: 10 }],
      }),
    ).rejects.toThrow(TargetSetTypeMismatchError);
  });

  it('should throw TargetSetTypeMismatchError with descriptive message', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise('weight-reps')];

    await expect(
      useCase.execute({
        dayId: 'd1',
        exerciseId: 'ex1',
        targetSets: [{ type: 'bodyweight-reps', reps: 10 }],
      }),
    ).rejects.toThrow('weight-reps');
  });

  it('should persist changes via repo.save', async () => {
    dayRepo.days = [makeDay()];
    exerciseRepo.exercises = [makeExercise('weight-reps')];
    const spy = jest.spyOn(dayRepo, 'save');

    await useCase.execute({
      dayId: 'd1',
      exerciseId: 'ex1',
      targetSets: [{ type: 'weight-reps', reps: 5, weightKg: 80 }],
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should throw when training day not found', async () => {
    exerciseRepo.exercises = [makeExercise('weight-reps')];

    await expect(
      useCase.execute({ dayId: 'nonexistent', exerciseId: 'ex1', targetSets: [] }),
    ).rejects.toThrow();
  });

  it('should throw when exercise not found', async () => {
    dayRepo.days = [makeDay()];

    await expect(
      useCase.execute({ dayId: 'd1', exerciseId: 'nonexistent', targetSets: [] }),
    ).rejects.toThrow();
  });
});
