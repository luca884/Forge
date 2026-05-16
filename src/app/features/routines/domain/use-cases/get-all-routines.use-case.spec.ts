import { TestBed } from '@angular/core/testing';
import { GetAllRoutinesUseCase } from './get-all-routines.use-case';
import { RoutineRepository } from '../routine.repository';
import { Routine } from '../routine.entity';

class StubRoutineRepository extends RoutineRepository {
  routines: Routine[] = [];

  override async getAll(): Promise<Routine[]> { return this.routines; }
  override async getActive(): Promise<Routine | null> { return null; }
  override async getById(_id: string): Promise<Routine | null> { return null; }
  override async save(_routine: Routine): Promise<void> {}
  override async setActive(_id: string): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

describe('GetAllRoutinesUseCase', () => {
  let useCase: GetAllRoutinesUseCase;
  let repo: StubRoutineRepository;

  beforeEach(() => {
    repo = new StubRoutineRepository();
    TestBed.configureTestingModule({
      providers: [
        GetAllRoutinesUseCase,
        { provide: RoutineRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetAllRoutinesUseCase);
  });

  it('should return all routines from the repository', async () => {
    const r1: Routine = { id: '1', name: 'PPL', isActive: true, createdAt: new Date(), updatedAt: new Date() };
    const r2: Routine = { id: '2', name: 'Full Body', isActive: false, createdAt: new Date(), updatedAt: new Date() };
    repo.routines = [r1, r2];

    const result = await useCase.execute();
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('1');
    expect(result[1]!.id).toBe('2');
  });

  it('should return empty array when no routines exist', async () => {
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });

  it('should delegate to repo.getAll', async () => {
    const spy = jest.spyOn(repo, 'getAll');
    await useCase.execute();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
