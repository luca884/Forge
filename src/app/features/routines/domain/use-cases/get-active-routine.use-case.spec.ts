import { TestBed } from '@angular/core/testing';
import { GetActiveRoutineUseCase } from './get-active-routine.use-case';
import { RoutineRepository } from '../routine.repository';
import { Routine } from '../routine.entity';

class StubRoutineRepository extends RoutineRepository {
  active: Routine | null = null;

  override async getAll(): Promise<Routine[]> { return []; }
  override async getActive(): Promise<Routine | null> { return this.active; }
  override async getById(_id: string): Promise<Routine | null> { return null; }
  override async save(_routine: Routine): Promise<void> {}
  override async setActive(_id: string): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

describe('GetActiveRoutineUseCase', () => {
  let useCase: GetActiveRoutineUseCase;
  let repo: StubRoutineRepository;

  beforeEach(() => {
    repo = new StubRoutineRepository();
    TestBed.configureTestingModule({
      providers: [
        GetActiveRoutineUseCase,
        { provide: RoutineRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetActiveRoutineUseCase);
  });

  it('should return the active routine when one exists', async () => {
    const routine: Routine = { id: 'r1', name: 'PPL', isActive: true, createdAt: new Date(), updatedAt: new Date() };
    repo.active = routine;

    const result = await useCase.execute();
    expect(result).toEqual(routine);
  });

  it('should return null when no active routine exists', async () => {
    const result = await useCase.execute();
    expect(result).toBeNull();
  });

  it('should delegate to repo.getActive', async () => {
    const spy = jest.spyOn(repo, 'getActive');
    await useCase.execute();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
