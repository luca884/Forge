import { TestBed } from '@angular/core/testing';
import { ReorderExercisesInDayUseCase } from './reorder-exercises-in-day.use-case';
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

  override async existsExerciseInAnyDay(_exerciseId: string): Promise<boolean> { return false; }
}

const OLD_DATE = new Date('2026-01-01T10:00:00Z');

const makeDay = (): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Empuje',
  exercises: [
    { exerciseId: 'bench', order: 0, targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 60 }], restSeconds: 120, note: 'pausa' },
    { exerciseId: 'ohp', order: 1, targetSets: [{ type: 'weight-reps', reps: 10 }] },
    { exerciseId: 'dips', order: 2, targetSets: [], restSeconds: 90 },
  ],
  createdAt: OLD_DATE,
  updatedAt: OLD_DATE,
});

describe('ReorderExercisesInDayUseCase', () => {
  let useCase: ReorderExercisesInDayUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    repo.days = [makeDay()];
    TestBed.configureTestingModule({
      providers: [
        ReorderExercisesInDayUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(ReorderExercisesInDayUseCase);
  });

  it('saves the exercises in the new order, renumbering order and keeping every other field', async () => {
    const updated = await useCase.execute({ dayId: 'd1', exerciseIds: ['dips', 'bench', 'ohp'] });

    const expected = [
      { exerciseId: 'dips', order: 0, targetSets: [], restSeconds: 90 },
      { exerciseId: 'bench', order: 1, targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 60 }], restSeconds: 120, note: 'pausa' },
      { exerciseId: 'ohp', order: 2, targetSets: [{ type: 'weight-reps', reps: 10 }] },
    ];
    expect(updated.exercises).toEqual(expected);
    expect(repo.days[0]!.exercises).toEqual(expected);
    expect(repo.days[0]!.updatedAt.getTime()).toBeGreaterThan(OLD_DATE.getTime());
    expect(repo.days[0]!.name).toBe('Empuje');
    expect(repo.days[0]!.routineId).toBe('r1');
  });

  it('throws without saving when the training day does not exist', async () => {
    const save = jest.spyOn(repo, 'save');

    await expect(useCase.execute({ dayId: 'missing', exerciseIds: ['bench'] })).rejects.toThrow(
      'TrainingDay not found: missing',
    );
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing exercise', ['bench', 'ohp']],
    ['an exercise not in the day', ['bench', 'ohp', 'squat']],
    ['a duplicated exercise', ['bench', 'ohp', 'ohp']],
    ['an extra exercise', ['bench', 'ohp', 'dips', 'squat']],
  ])('throws without saving when the new order has %s', async (_case, exerciseIds) => {
    const save = jest.spyOn(repo, 'save');

    await expect(useCase.execute({ dayId: 'd1', exerciseIds })).rejects.toThrow(
      'The new order must contain exactly the exercises of day d1',
    );
    expect(save).not.toHaveBeenCalled();
    expect(repo.days[0]).toEqual(makeDay());
  });
});
