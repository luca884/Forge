import { TestBed } from '@angular/core/testing';
import { SetActiveRoutineUseCase } from './set-active-routine.use-case';
import { RoutineRepository } from '../routine.repository';
import { Routine } from '../routine.entity';

class StubRoutineRepository extends RoutineRepository {
  activeId: string | null = null;

  override async getAll(): Promise<Routine[]> { return []; }
  override async getActive(): Promise<Routine | null> { return null; }
  override async getById(_id: string): Promise<Routine | null> { return null; }
  override async save(_routine: Routine): Promise<void> {}

  override async setActive(id: string): Promise<void> {
    this.activeId = id;
  }

  override async delete(_id: string): Promise<void> {}
}

describe('SetActiveRoutineUseCase', () => {
  let useCase: SetActiveRoutineUseCase;
  let repo: StubRoutineRepository;

  beforeEach(() => {
    repo = new StubRoutineRepository();
    TestBed.configureTestingModule({
      providers: [
        SetActiveRoutineUseCase,
        { provide: RoutineRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(SetActiveRoutineUseCase);
  });

  it('should call repo.setActive with the provided id', async () => {
    const spy = jest.spyOn(repo, 'setActive');
    await useCase.execute('routine-1');
    expect(spy).toHaveBeenCalledWith('routine-1');
  });

  it('should delegate setActive to repository', async () => {
    await useCase.execute('routine-2');
    expect(repo.activeId).toBe('routine-2');
  });
});
