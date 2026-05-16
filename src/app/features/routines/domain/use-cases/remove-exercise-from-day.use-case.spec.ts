import { TestBed } from '@angular/core/testing';
import { RemoveExerciseFromDayUseCase } from './remove-exercise-from-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

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

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [
    { exerciseId: 'ex1', order: 0, targetSets: [] },
    { exerciseId: 'ex2', order: 1, targetSets: [] },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('RemoveExerciseFromDayUseCase', () => {
  let useCase: RemoveExerciseFromDayUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        RemoveExerciseFromDayUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(RemoveExerciseFromDayUseCase);
  });

  it('should remove exercise from training day by exerciseId', async () => {
    repo.days = [makeDay()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(updated.exercises).toHaveLength(1);
    expect(updated.exercises[0]!.exerciseId).toBe('ex2');
  });

  it('should throw when training day not found', async () => {
    await expect(useCase.execute({ dayId: 'nonexistent', exerciseId: 'ex1' }))
      .rejects.toThrow();
  });

  it('should persist changes via repo.save', async () => {
    repo.days = [makeDay()];
    const spy = jest.spyOn(repo, 'save');

    await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should reindex order of remaining exercises', async () => {
    repo.days = [makeDay()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1' });

    expect(updated.exercises[0]!.order).toBe(0);
  });
});
