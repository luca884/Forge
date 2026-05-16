import { TestBed } from '@angular/core/testing';
import { GetExerciseHistoryUseCase } from './get-exercise-history.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { WorkedSet, WeightRepsSet } from '@features/training/domain/worked-set';
import { Session } from '@features/training/domain/session.entity';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

function makeWeightRepsSet(id: string, createdAt: Date, exerciseId = 'ex-1'): WeightRepsSet {
  return {
    id,
    sessionId: 's-1',
    exerciseId,
    type: 'weight-reps',
    reps: new Reps(5),
    weight: new Weight(80),
    isPR: false,
    createdAt,
    updatedAt: createdAt,
  };
}

class StubSessionRepository extends SessionRepository {
  sets: WorkedSet[] = [];
  lastExerciseIdArg: string | null = null;

  override async getActive(): Promise<Session | null> { return null; }
  override async getById(_id: string): Promise<Session | null> { return null; }
  override async save(_session: Session): Promise<void> {}
  override async addSetToSession(_sId: string, _set: WorkedSet): Promise<void> {}
  override async editWorkedSet(_sId: string, _set: WorkedSet): Promise<void> {}
  override async removeWorkedSet(_sId: string, _setId: string): Promise<void> {}
  override async getSetsForSession(_sId: string): Promise<WorkedSet[]> { return []; }
  override async getLastWorkedSetForExercise(_eId: string): Promise<WorkedSet | null> { return null; }
  override async getAllWorkedSetsForExercise(exerciseId: string): Promise<WorkedSet[]> {
    this.lastExerciseIdArg = exerciseId;
    return this.sets;
  }
}

describe('GetExerciseHistoryUseCase', () => {
  let useCase: GetExerciseHistoryUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    repo = new StubSessionRepository();
    TestBed.configureTestingModule({
      providers: [
        GetExerciseHistoryUseCase,
        { provide: SessionRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetExerciseHistoryUseCase);
  });

  it('should return worked sets for the given exercise', async () => {
    const sets = [
      makeWeightRepsSet('set-1', new Date('2024-05-01')),
      makeWeightRepsSet('set-2', new Date('2024-05-05')),
      makeWeightRepsSet('set-3', new Date('2024-05-10')),
      makeWeightRepsSet('set-4', new Date('2024-05-12')),
      makeWeightRepsSet('set-5', new Date('2024-05-15')),
    ];
    repo.sets = sets;

    const result = await useCase.execute({ exerciseId: 'ex-1' });

    expect(result).toHaveLength(5);
  });

  it('should return empty array when no sets exist for the exercise', async () => {
    repo.sets = [];

    const result = await useCase.execute({ exerciseId: 'unknown' });

    expect(result).toEqual([]);
  });

  it('should pass exerciseId to SessionRepository.getAllWorkedSetsForExercise', async () => {
    await useCase.execute({ exerciseId: 'ex-42' });

    expect(repo.lastExerciseIdArg).toBe('ex-42');
  });

  it('should return sets ordered by createdAt ascending (as returned by repo)', async () => {
    // Per ADR-15: repo is responsible for ordering ASC; use case passes through.
    // The design states createdAt ASC for the chart (chronological).
    const sets = [
      makeWeightRepsSet('set-1', new Date('2024-05-01')),
      makeWeightRepsSet('set-2', new Date('2024-05-05')),
      makeWeightRepsSet('set-3', new Date('2024-05-10')),
    ];
    repo.sets = sets;

    const result = await useCase.execute({ exerciseId: 'ex-1' });

    expect(result[0].id).toBe('set-1');
    expect(result[1].id).toBe('set-2');
    expect(result[2].id).toBe('set-3');
  });

  it('should delegate to SessionRepository and return its result unchanged', async () => {
    const spy = jest.spyOn(repo, 'getAllWorkedSetsForExercise');
    const sets = [makeWeightRepsSet('set-1', new Date('2024-05-01'))];
    repo.sets = sets;

    const result = await useCase.execute({ exerciseId: 'ex-1' });

    expect(spy).toHaveBeenCalledWith('ex-1');
    expect(result).toEqual(sets);
  });
});
