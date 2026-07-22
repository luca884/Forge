import { TestBed } from '@angular/core/testing';
import { GetDashboardOverviewUseCase } from './get-dashboard-overview.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { Session } from '@features/training/domain/session.entity';
import { WorkedSet, WeightRepsSet } from '@features/training/domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

function makeWRSet(id: string, sessionId: string, createdAt: Date, weightKg = 100, repsValue = 5): WeightRepsSet {
  return {
    id,
    sessionId,
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: new Reps(repsValue),
    weight: new Weight(weightKg),
    isPR: false,
    createdAt,
  };
}

class StubSessionRepository extends SessionRepository {
  sets: WorkedSet[] = [];
  fromDates: Date[] = [];

  override async getWorkedSetsSince(fromDate: Date): Promise<WorkedSet[]> {
    this.fromDates.push(fromDate);
    const fromTime = fromDate.getTime();
    return this.sets.filter(s => s.createdAt.getTime() >= fromTime);
  }

  override async getActive(): Promise<Session | null> { return null; }
  override async getById(_id: string): Promise<Session | null> { return null; }
  override async save(_s: Session): Promise<void> {}
  override async addSetToSession(_sId: string, _set: WorkedSet): Promise<void> {}
  override async editWorkedSet(_sId: string, _set: WorkedSet): Promise<void> {}
  override async removeWorkedSet(_sId: string, _setId: string): Promise<void> {}
  override async getSetsForSession(_sId: string): Promise<WorkedSet[]> { return []; }
  override async getAllWorkedSetsForExercise(_eId: string): Promise<WorkedSet[]> { return []; }
  override async getLastWorkedSetForExercise(_eId: string): Promise<WorkedSet | null> { return null; }
  override async getAllSessions(_fromDate?: Date): Promise<Session[]> { return []; }
  override async existsWorkedSetForExercise(_eId: string): Promise<boolean> { return false; }
  override async deleteSession(_sessionId: string): Promise<void> {}
  override async deleteSetsBySessionId(_sessionId: string): Promise<string[]> { return []; }
}

describe('GetDashboardOverviewUseCase', () => {
  let useCase: GetDashboardOverviewUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    repo = new StubSessionRepository();
    TestBed.configureTestingModule({
      providers: [
        GetDashboardOverviewUseCase,
        { provide: SessionRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetDashboardOverviewUseCase);
  });

  it('returns zeros and null deltas when no sessions exist', async () => {
    const result = await useCase.execute();
    expect(result.sessionsCurrent).toBe(0);
    expect(result.sessionsDeltaPct).toBeNull();
    expect(result.volumeCurrentKg).toBe(0);
  });

  it('passes the current window start date to the repository', async () => {
    const today = new Date();
    await useCase.execute();
    const expectedCurrent = new Date(today);
    expectedCurrent.setDate(today.getDate() - 30);
    expect(Math.abs(repo.fromDates[0]!.getTime() - expectedCurrent.getTime())).toBeLessThan(2000);
  });

  it('computes 100% deltas when current window has data and prior window is empty', async () => {
    const today = new Date();
    const currentStart = new Date(today);
    currentStart.setDate(today.getDate() - 15);

    repo.sets = [makeWRSet('ws-1', 's1', currentStart)];
    const result = await useCase.execute();

    expect(result.sessionsCurrent).toBe(1);
    expect(result.sessionsPrior).toBe(0);
    expect(result.sessionsDeltaPct).toBeNull();
    expect(result.volumeCurrentKg).toBe(100 * 5);
    expect(result.volumeDeltaPct).toBeNull();
  });

  it('filters prior window to exclude current window sets', async () => {
    const today = new Date();
    const currentStart = new Date(today);
    currentStart.setDate(today.getDate() - 10);
    const priorStart = new Date(today);
    priorStart.setDate(today.getDate() - 25);

    repo.sets = [
      makeWRSet('ws-1', 's1', currentStart),
      makeWRSet('ws-2', 's2', priorStart),
    ];

    const result = await useCase.execute({ dateWindowDays: 15 });

    expect(result.sessionsCurrent).toBe(1);
    expect(result.sessionsPrior).toBe(1);
    expect(result.volumeCurrentKg).toBe(100 * 5);
    expect(result.volumePriorKg).toBe(100 * 5);
    expect(result.volumeDeltaPct).toBe(0);
  });

  it('returns negative deltas when prior window exceeds current window', async () => {
    const today = new Date();
    const currentStart = new Date(today);
    currentStart.setDate(today.getDate() - 5);
    const priorStart = new Date(today);
    priorStart.setDate(today.getDate() - 12);

    repo.sets = [
      makeWRSet('ws-1', 's1', currentStart, 100, 5),
      makeWRSet('ws-2', 's2', priorStart, 100, 5),
      makeWRSet('ws-3', 's3', priorStart, 100, 5),
    ];

    const result = await useCase.execute({ dateWindowDays: 7 });

    expect(result.setsCurrent).toBe(1);
    expect(result.setsPrior).toBe(2);
    expect(result.setsDeltaPct).toBe(-50);
  });

  it('honours custom dateWindowDays parameter', async () => {
    const today = new Date();
    await useCase.execute({ dateWindowDays: 14 });
    const expectedCurrent = new Date(today);
    expectedCurrent.setDate(today.getDate() - 14);
    expect(Math.abs(repo.fromDates[0]!.getTime() - expectedCurrent.getTime())).toBeLessThan(2000);
  });
});
