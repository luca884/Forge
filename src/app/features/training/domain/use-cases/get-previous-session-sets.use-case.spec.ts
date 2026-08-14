/**
 * GetPreviousSessionSetsUseCase spec — TDD strict (RED first).
 *
 * The use case returns the sets logged for an exercise in the most recent
 * session that is NOT the active one, ordered by set slot. The UI uses it to
 * prefill each set input with what was done last time, slot by slot.
 *
 * Historical gotcha (documented in get-progression-target.use-case.spec.ts):
 * stubs that ignore exerciseId hide cross-exercise contamination bugs, so the
 * stub below keys its data by exerciseId.
 */
import { TestBed } from '@angular/core/testing';
import { GetPreviousSessionSetsUseCase } from './get-previous-session-sets.use-case';
import { SessionRepository } from '../session.repository';
import { Session } from '../session.entity';
import { WorkedSet, WeightRepsSet } from '../worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

class StubSessionRepository extends SessionRepository {
  private readonly store = new Map<string, WorkedSet[]>();

  setDataForExercise(exerciseId: string, sets: WorkedSet[]): void {
    this.store.set(exerciseId, sets);
  }

  override getAllWorkedSetsForExercise(exerciseId: string): Promise<WorkedSet[]> {
    return Promise.resolve(this.store.get(exerciseId) ?? []);
  }

  override getActive() { return Promise.resolve(null); }
  override getById(_id: string) { return Promise.resolve(null as Session | null); }
  override save(_s: Session) { return Promise.resolve(); }
  override addSetToSession(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override editWorkedSet(_sId: string, _set: WorkedSet) { return Promise.resolve(); }
  override removeWorkedSet(_sId: string, _setId: string) { return Promise.resolve(); }
  override getSetsForSession(_sId: string) { return Promise.resolve([]); }
  override getLastWorkedSetForExercise(_eId: string) { return Promise.resolve(null); }
  override getAllSessions(_fromDate?: Date) { return Promise.resolve([]); }
  override getWorkedSetsSince(_fromDate: Date) { return Promise.resolve([]); }
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
}

function makeWRSet(
  exerciseId: string,
  sessionId: string,
  reps: number,
  weightKg: number,
  createdAt: Date,
  targetSetIndex?: number,
): WeightRepsSet {
  return {
    id: `wr-${sessionId}-${reps}-${weightKg}-${createdAt.getTime()}`,
    sessionId,
    exerciseId,
    targetSetIndex,
    isPR: false,
    createdAt,
    type: 'weight-reps',
    reps: new Reps(reps),
    weight: new Weight(weightKg),
  };
}

describe('GetPreviousSessionSetsUseCase', () => {
  let useCase: GetPreviousSessionSetsUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetPreviousSessionSetsUseCase,
        { provide: SessionRepository, useClass: StubSessionRepository },
      ],
    });
    useCase = TestBed.inject(GetPreviousSessionSetsUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
  });

  it('returns an empty array when the exercise has no history', async () => {
    repo.setDataForExercise('ex-1', []);
    const result = await useCase.execute('ex-1', 'active-session');
    expect(result).toEqual([]);
  });

  it('returns an empty array when every set belongs to the active session', async () => {
    repo.setDataForExercise('ex-1', [
      makeWRSet('ex-1', 'active-session', 8, 20, new Date('2026-02-10T10:00:00Z'), 0),
    ]);
    const result = await useCase.execute('ex-1', 'active-session');
    expect(result).toEqual([]);
  });

  it('returns only the sets of the most recent non-active session', async () => {
    repo.setDataForExercise('ex-1', [
      makeWRSet('ex-1', 'sess-old', 8, 15, new Date('2026-02-01T10:00:00Z'), 0),
      makeWRSet('ex-1', 'sess-last', 8, 20, new Date('2026-02-08T10:00:00Z'), 0),
      makeWRSet('ex-1', 'sess-last', 7, 20, new Date('2026-02-08T10:05:00Z'), 1),
      makeWRSet('ex-1', 'active-session', 6, 25, new Date('2026-02-15T10:00:00Z'), 0),
    ]);

    const result = await useCase.execute('ex-1', 'active-session');

    expect(result.map((s) => s.sessionId)).toEqual(['sess-last', 'sess-last']);
  });

  it('orders the returned sets by targetSetIndex ascending', async () => {
    repo.setDataForExercise('ex-1', [
      makeWRSet('ex-1', 'sess-last', 6, 17.5, new Date('2026-02-08T10:10:00Z'), 2),
      makeWRSet('ex-1', 'sess-last', 8, 20, new Date('2026-02-08T10:00:00Z'), 0),
      makeWRSet('ex-1', 'sess-last', 7, 20, new Date('2026-02-08T10:05:00Z'), 1),
    ]);

    const result = (await useCase.execute('ex-1', 'active-session')) as WeightRepsSet[];

    expect(result.map((s) => s.reps.value)).toEqual([8, 7, 6]);
    expect(result.map((s) => s.weight.value)).toEqual([20, 20, 17.5]);
  });

  it('falls back to createdAt ordering when targetSetIndex is missing', async () => {
    repo.setDataForExercise('ex-1', [
      makeWRSet('ex-1', 'sess-last', 6, 17.5, new Date('2026-02-08T10:10:00Z')),
      makeWRSet('ex-1', 'sess-last', 8, 20, new Date('2026-02-08T10:00:00Z')),
      makeWRSet('ex-1', 'sess-last', 7, 20, new Date('2026-02-08T10:05:00Z')),
    ]);

    const result = (await useCase.execute('ex-1', 'active-session')) as WeightRepsSet[];

    expect(result.map((s) => s.reps.value)).toEqual([8, 7, 6]);
  });

  it('never returns sets of a different exercise', async () => {
    repo.setDataForExercise('ex-1', [
      makeWRSet('ex-1', 'sess-last', 8, 20, new Date('2026-02-08T10:00:00Z'), 0),
    ]);
    repo.setDataForExercise('ex-2', [
      makeWRSet('ex-2', 'sess-last', 12, 40, new Date('2026-02-09T10:00:00Z'), 0),
    ]);

    const result = (await useCase.execute('ex-1', 'active-session')) as WeightRepsSet[];

    expect(result).toHaveLength(1);
    expect(result[0]!.weight.value).toBe(20);
  });
});
