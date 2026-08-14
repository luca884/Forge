import { TestBed } from '@angular/core/testing';
import { GetSessionHeatmapUseCase } from './get-session-heatmap.use-case';
import { SessionRepository } from '@features/training/domain/session.repository';
import { Session } from '@features/training/domain/session.entity';
import { WorkedSet } from '@features/training/domain/worked-set';

function makeSession(id: string, startedAt: Date): Session {
  return {
    id,
    routineId: 'r-1',
    dayId: 'd-1',
    date: startedAt.toLocaleDateString('en-CA'),
    startedAt,
    status: 'completed',
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

/** N days ago at the given local hour — keeps sessions inside the 84-day window. */
function daysAgoAt(days: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

class StubSessionRepository extends SessionRepository {
  sessions: Session[] = [];

  override async getActive(): Promise<Session | null> { return null; }
  override async getById(_id: string): Promise<Session | null> { return null; }
  override async save(_s: Session): Promise<void> {}
  override async addSetToSession(_sId: string, _set: WorkedSet): Promise<void> {}
  override async editWorkedSet(_sId: string, _set: WorkedSet): Promise<void> {}
  override async removeWorkedSet(_sId: string, _setId: string): Promise<void> {}
  override async getSetsForSession(_sId: string): Promise<WorkedSet[]> { return []; }
  override async getAllWorkedSetsForExercise(_eId: string): Promise<WorkedSet[]> { return []; }
  override async getLastWorkedSetForExercise(_eId: string): Promise<WorkedSet | null> { return null; }
  override async getAllSessions(_fromDate?: Date): Promise<Session[]> {
    if (_fromDate) {
      return this.sessions.filter(s => s.startedAt >= _fromDate);
    }
    return this.sessions;
  }
  override async getWorkedSetsSince(_fromDate: Date): Promise<WorkedSet[]> { return []; }
  override async existsWorkedSetForExercise(_eId: string): Promise<boolean> { return false; }
  override async deleteSession(_sessionId: string): Promise<void> {}
  override async deleteSetsBySessionId(_sessionId: string): Promise<string[]> { return []; }
}

describe('GetSessionHeatmapUseCase', () => {
  let useCase: GetSessionHeatmapUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    repo = new StubSessionRepository();
    TestBed.configureTestingModule({
      providers: [
        GetSessionHeatmapUseCase,
        { provide: SessionRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetSessionHeatmapUseCase);
  });

  it('returns empty map when no sessions exist', async () => {
    repo.sessions = [];
    const result = await useCase.execute();
    expect(result.size).toBe(0);
  });

  it('counts sessions grouped by local date (en-CA YYYY-MM-DD)', async () => {
    // The use case reads a rolling 84-day window, so the dates must be relative:
    // fixed dates drop out of the window as time passes.
    const dayA = daysAgoAt(4, 9);
    const dayB = daysAgoAt(3, 8);
    repo.sessions = [
      makeSession('s1', dayA),
      makeSession('s2', daysAgoAt(4, 18)),
      makeSession('s3', dayB),
    ];
    const result = await useCase.execute();
    expect(result.get(dayA.toLocaleDateString('en-CA'))).toBe(2);
    expect(result.get(dayB.toLocaleDateString('en-CA'))).toBe(1);
  });

  it('does not include keys for days with 0 sessions (sparse map)', async () => {
    repo.sessions = [makeSession('s1', daysAgoAt(10, 10))];
    const result = await useCase.execute();
    // Only 1 key, no zeros for other days
    expect(result.size).toBe(1);
  });

  it('passes fromDate (today - 84 days) to the repository', async () => {
    const spy = jest.spyOn(repo, 'getAllSessions');
    repo.sessions = [];
    await useCase.execute();
    expect(spy).toHaveBeenCalledTimes(1);
    const [fromDate] = spy.mock.calls[0]!;
    // fromDate should be approximately 84 days ago
    const now = new Date();
    const expectedFrom = new Date(now);
    expectedFrom.setDate(now.getDate() - 84);
    // Allow 1-second tolerance for test timing
    expect(Math.abs(fromDate!.getTime() - expectedFrom.getTime())).toBeLessThan(2000);
  });

  it('sessions outside the 84-day window do not appear in the map', async () => {
    // Use the stub's filter — sessions before fromDate are excluded
    const now = new Date();
    const veryOld = new Date(now);
    veryOld.setDate(now.getDate() - 100);
    repo.sessions = [makeSession('old', veryOld)];
    const result = await useCase.execute();
    // The stub filters by fromDate so the old session won't appear
    expect(result.size).toBe(0);
  });
});
