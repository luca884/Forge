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
    const day = new Date('2026-05-10T09:00:00');
    repo.sessions = [
      makeSession('s1', new Date('2026-05-10T09:00:00')),
      makeSession('s2', new Date('2026-05-10T18:00:00')),
      makeSession('s3', new Date('2026-05-11T08:00:00')),
    ];
    const result = await useCase.execute();
    expect(result.get(day.toLocaleDateString('en-CA'))).toBe(2);
    expect(result.get(new Date('2026-05-11T08:00:00').toLocaleDateString('en-CA'))).toBe(1);
  });

  it('does not include keys for days with 0 sessions (sparse map)', async () => {
    repo.sessions = [makeSession('s1', new Date('2026-05-01T10:00:00'))];
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
