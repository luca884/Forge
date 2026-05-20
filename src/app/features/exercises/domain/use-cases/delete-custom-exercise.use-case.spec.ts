import { TestBed } from '@angular/core/testing';
import { DeleteCustomExerciseUseCase } from './delete-custom-exercise.use-case';
import { ExerciseRepository } from '../exercise.repository';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotDeleteBuiltInExerciseError } from '../errors/cannot-delete-built-in-exercise.error';
import { ExerciseInUseError } from '../errors/exercise-in-use.error';
import { SessionRepository } from '@features/training/domain/session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';

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

/**
 * Builds a partial SessionRepository mock with existsWorkedSetForExercise returning the given value.
 * All other methods are no-ops; we only care about the existence check.
 */
function makeSessionRepo(exists: boolean): Partial<SessionRepository> {
  return { existsWorkedSetForExercise: jest.fn().mockResolvedValue(exists) };
}

function makePrRepo(exists: boolean): Partial<PersonalRecordRepository> {
  return { existsByExerciseId: jest.fn().mockResolvedValue(exists) };
}

function makeTrainingDayRepo(exists: boolean): Partial<TrainingDayRepository> {
  return { existsExerciseInAnyDay: jest.fn().mockResolvedValue(exists) };
}

describe('DeleteCustomExerciseUseCase', () => {
  let useCase: DeleteCustomExerciseUseCase;
  let repo: InMemoryExerciseRepository;

  function configure(
    sessionExists = false,
    prExists = false,
    dayExists = false,
  ): void {
    repo = new InMemoryExerciseRepository();

    TestBed.configureTestingModule({
      providers: [
        DeleteCustomExerciseUseCase,
        { provide: ExerciseRepository, useValue: repo },
        { provide: SessionRepository, useValue: makeSessionRepo(sessionExists) },
        { provide: PersonalRecordRepository, useValue: makePrRepo(prExists) },
        { provide: TrainingDayRepository, useValue: makeTrainingDayRepo(dayExists) },
      ],
    });

    useCase = TestBed.inject(DeleteCustomExerciseUseCase);
  }

  beforeEach(() => {
    configure();
  });

  // ─── existing behavior (regression) ──────────────────────────────────────────

  it('should call exerciseRepo.delete for a custom exercise with no references (D-21/S1)', async () => {
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
    repo.setExercises([makeExercise({ id: 'custom-2', isCustom: true })]);

    await useCase.execute({ id: 'custom-2' });

    expect(repo.deletedIds).toEqual(['custom-2']);
  });

  // ─── P3-2: in-use guard ───────────────────────────────────────────────────────

  it('should throw ExerciseInUseError when a worked set references the exercise (P3-2/S1)', async () => {
    TestBed.resetTestingModule();
    configure(true, false, false); // sessionExists = true
    repo.setExercises([makeExercise({ id: 'ex-used', isCustom: true })]);

    await expect(
      useCase.execute({ id: 'ex-used' }),
    ).rejects.toThrow(ExerciseInUseError);

    expect(repo.deletedIds).toHaveLength(0);
  });

  it('should throw ExerciseInUseError when a PersonalRecord references the exercise (P3-2/S2)', async () => {
    TestBed.resetTestingModule();
    configure(false, true, false); // prExists = true
    repo.setExercises([makeExercise({ id: 'ex-pr', isCustom: true })]);

    await expect(
      useCase.execute({ id: 'ex-pr' }),
    ).rejects.toThrow(ExerciseInUseError);

    expect(repo.deletedIds).toHaveLength(0);
  });

  it('should throw ExerciseInUseError when a TrainingDay references the exercise (P3-2/S3)', async () => {
    TestBed.resetTestingModule();
    configure(false, false, true); // dayExists = true
    repo.setExercises([makeExercise({ id: 'ex-day', isCustom: true })]);

    await expect(
      useCase.execute({ id: 'ex-day' }),
    ).rejects.toThrow(ExerciseInUseError);

    expect(repo.deletedIds).toHaveLength(0);
  });

  it('ExerciseInUseError should carry the exerciseId (P3-2/S4)', async () => {
    TestBed.resetTestingModule();
    configure(true, false, false);
    repo.setExercises([makeExercise({ id: 'ex-carry', isCustom: true })]);

    let caught: unknown;
    try {
      await useCase.execute({ id: 'ex-carry' });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ExerciseInUseError);
    expect((caught as ExerciseInUseError).exerciseId).toBe('ex-carry');
  });
});
