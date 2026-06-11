import { TestBed } from '@angular/core/testing';
import { GetLastWorkedSetForExerciseUseCase } from './get-last-worked-set-for-exercise.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet, WeightRepsSet } from '../worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

class StubSessionRepository extends SessionRepository {
  lastSet: WorkedSet | null = null;

  override getActive() { return Promise.resolve(null); }
  override getById(_id: string) { return Promise.resolve(null as Session | null); }
  override save(_s: Session) { return Promise.resolve(); }
  override addSetToSession(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, _setId: string) { return Promise.resolve(); }
  override getSetsForSession(_sId: string) { return Promise.resolve([]); }
  override getAllWorkedSetsForExercise(_eId: string) { return Promise.resolve([]); }
  override getLastWorkedSetForExercise(_eId: string) {
    return Promise.resolve(this.lastSet);
  }
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
}

describe('GetLastWorkedSetForExerciseUseCase', () => {
  let useCase: GetLastWorkedSetForExerciseUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetLastWorkedSetForExerciseUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
      ],
    });
    useCase = TestBed.inject(GetLastWorkedSetForExerciseUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
  });

  it('should return null when no previous set exists for the exercise', async () => {
    repo.lastSet = null;
    expect(await useCase.execute('ex-1')).toBeNull();
  });

  it('should return the last worked set for the exercise', async () => {
    const set: WeightRepsSet = {
      id: 'set-1', sessionId: 's-1', exerciseId: 'ex-1',
      isPR: true, createdAt: new Date(),
      type: 'weight-reps', reps: new Reps(10), weight: new Weight(100),
    };
    repo.lastSet = set;
    expect(await useCase.execute('ex-1')).toEqual(set);
  });
});
