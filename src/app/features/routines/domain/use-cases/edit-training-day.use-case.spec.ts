import { TestBed } from '@angular/core/testing';
import { EditTrainingDayUseCase } from './edit-training-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_routineId: string): Promise<TrainingDay[]> { return []; }

  override async save(day: TrainingDay): Promise<void> {
    const idx = this.days.findIndex(d => d.id === day.id);
    if (idx >= 0) this.days[idx] = day;
    else this.days.push(day);
  }

  override async delete(_id: string): Promise<void> {}
}

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Original Day',
  exercises: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('EditTrainingDayUseCase', () => {
  let useCase: EditTrainingDayUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        EditTrainingDayUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(EditTrainingDayUseCase);
  });

  it('should update name and label of existing training day', async () => {
    repo.days = [makeDay()];

    const updated = await useCase.execute({ id: 'd1', name: 'Día A', label: 'Push' });

    expect(updated.name).toBe('Día A');
    expect(updated.label).toBe('Push');
  });

  it('should preserve exercises when editing', async () => {
    repo.days = [makeDay({ exercises: [{ exerciseId: 'ex1', order: 0, targetSets: [] }] })];

    const updated = await useCase.execute({ id: 'd1', name: 'New Name' });

    expect(updated.exercises).toHaveLength(1);
  });

  it('should throw when training day not found', async () => {
    await expect(useCase.execute({ id: 'nonexistent', name: 'X' }))
      .rejects.toThrow();
  });

  it('should persist changes via repo.save', async () => {
    repo.days = [makeDay()];
    const spy = jest.spyOn(repo, 'save');

    await useCase.execute({ id: 'd1', name: 'Updated' });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
