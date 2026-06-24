/**
 * Integration test: GetSessionHeatmapUseCase + DexieSessionRepository (real DB, fake-indexeddb).
 *
 * Verifies the full data path from DB persistence to heatmap Map output without any stubs.
 * fake-indexeddb is registered globally in setup-jest.ts — no per-file import needed.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { DexieSessionRepository } from '@features/training/data/dexie-session.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import { Session } from '@features/training/domain/session.entity';
import { GetSessionHeatmapUseCase } from './get-session-heatmap.use-case';

function makeSession(overrides: Partial<Session> & { id: string; startedAt: Date }): Session {
  return {
    routineId: 'routine-1',
    dayId: 'day-1',
    date: overrides.startedAt.toLocaleDateString('en-CA'),
    status: 'completed',
    createdAt: overrides.startedAt,
    updatedAt: overrides.startedAt,
    ...overrides,
  };
}

describe('GetSessionHeatmapUseCase — integration (real DB)', () => {
  let db: ForgeDatabaseService;
  let repo: DexieSessionRepository;
  let useCase: GetSessionHeatmapUseCase;

  beforeEach(async () => {
    db = new ForgeDatabaseService();
    TestBed.configureTestingModule({
      providers: [
        DexieSessionRepository,
        GetSessionHeatmapUseCase,
        { provide: SessionRepository, useClass: DexieSessionRepository },
        { provide: ForgeDatabaseService, useValue: db },
      ],
    });
    repo = TestBed.inject(DexieSessionRepository);
    useCase = TestBed.inject(GetSessionHeatmapUseCase);
    await db.sessions.clear();
  });

  afterEach(() => {
    db.close();
  });

  it('returns empty map when DB has no sessions', async () => {
    const result = await useCase.execute();
    expect(result.size).toBe(0);
  });

  it('counts sessions correctly for today and a day with 2 sessions', async () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');

    // A day 10 days ago — with 2 sessions
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    const tenDaysAgoKey = tenDaysAgo.toLocaleDateString('en-CA');

    // 1 session today (in-progress — getAllSessions does NOT filter by status)
    await repo.save(makeSession({
      id: 'session-today',
      startedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
    }));

    // 2 sessions 10 days ago
    await repo.save(makeSession({
      id: 'session-10d-a',
      startedAt: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 8, 0, 0),
    }));
    await repo.save(makeSession({
      id: 'session-10d-b',
      startedAt: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 18, 0, 0),
    }));

    const result = await useCase.execute();

    expect(result.get(todayKey)).toBe(1);
    expect(result.get(tenDaysAgoKey)).toBe(2);
  });

  it('excludes sessions older than 84 days', async () => {
    const today = new Date();

    // Session exactly 85 days ago — should be excluded
    const tooOld = new Date(today);
    tooOld.setDate(today.getDate() - 85);
    await repo.save(makeSession({
      id: 'session-too-old',
      startedAt: tooOld,
    }));

    // Session 30 days ago — should be included
    const recent = new Date(today);
    recent.setDate(today.getDate() - 30);
    const recentKey = recent.toLocaleDateString('en-CA');
    await repo.save(makeSession({
      id: 'session-recent',
      startedAt: recent,
    }));

    const result = await useCase.execute();

    expect(result.size).toBe(1);
    expect(result.get(recentKey)).toBe(1);
  });

  it('groups multiple sessions on the same date under a single key', async () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');

    for (let i = 0; i < 3; i++) {
      await repo.save(makeSession({
        id: `session-${i}`,
        startedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7 + i, 0, 0),
      }));
    }

    const result = await useCase.execute();

    expect(result.size).toBe(1);
    expect(result.get(todayKey)).toBe(3);
  });
});
