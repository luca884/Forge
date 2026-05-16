import { TestBed } from '@angular/core/testing';
import { RemoveTrainingDayUseCase } from './remove-training-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_routineId: string): Promise<TrainingDay[]> { return []; }
  override async save(_day: TrainingDay): Promise<void> {}

  override async delete(id: string): Promise<void> {
    this.days = this.days.filter(d => d.id !== id);
  }
}

const makeDay = (): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('RemoveTrainingDayUseCase', () => {
  let useCase: RemoveTrainingDayUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        RemoveTrainingDayUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(RemoveTrainingDayUseCase);
  });

  it('should delete the training day by id', async () => {
    repo.days = [makeDay()];
    const spy = jest.spyOn(repo, 'delete');

    await useCase.execute('d1');

    expect(spy).toHaveBeenCalledWith('d1');
    expect(repo.days).toHaveLength(0);
  });

  it('should call repo.delete with the provided id', async () => {
    const spy = jest.spyOn(repo, 'delete');
    await useCase.execute('any-id');
    expect(spy).toHaveBeenCalledWith('any-id');
  });
});
