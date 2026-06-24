/**
 * GetProgressionTargetUseCase spec — TDD strict (RED first).
 *
 * The use case:
 *   1. Calls getAllWorkedSetsForExercise(exerciseId) — the mock MUST honour exerciseId.
 *   2. Excludes the active session's sets.
 *   3. Delegates to ProgressionTargetCalculator.
 *   4. Returns ProgressionTarget | null.
 *
 * Historical gotcha (documented): stubs that ignore exerciseId hid real bugs.
 * This mock returns data keyed by exerciseId so cross-contamination is caught.
 */
import { TestBed } from '@angular/core/testing';
import { GetProgressionTargetUseCase } from './get-progression-target.use-case';
import { SessionRepository } from '../session.repository';
import { ProgressionTargetCalculator } from '../services/progression-target-calculator';
import { Session } from '../session.entity';
import { WorkedSet, WeightRepsSet } from '../worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

// ── Stub repo that honours exerciseId (never returns wrong-exercise data) ─────

class StubSessionRepository extends SessionRepository {
  private readonly store = new Map<string, WorkedSet[]>();

  /** Set up data for a specific exerciseId. */
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
  override existsWorkedSetForExercise(_eId: string) { return Promise.resolve(false); }
  override deleteSession(_sessionId: string) { return Promise.resolve(); }
  override deleteSetsBySessionId(_sessionId: string) { return Promise.resolve([]); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWRSet(
  exerciseId: string,
  sessionId: string,
  reps: number,
  weightKg: number,
  createdAt = new Date('2026-01-01'),
): WeightRepsSet {
  return {
    id: `wr-${Math.random()}`,
    sessionId,
    exerciseId,
    isPR: false,
    createdAt,
    type: 'weight-reps',
    reps: new Reps(reps),
    weight: new Weight(weightKg),
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('GetProgressionTargetUseCase', () => {
  let useCase: GetProgressionTargetUseCase;
  let repo: StubSessionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetProgressionTargetUseCase,
        ProgressionTargetCalculator,
        { provide: SessionRepository, useClass: StubSessionRepository },
      ],
    });
    useCase = TestBed.inject(GetProgressionTargetUseCase);
    repo = TestBed.inject(SessionRepository) as StubSessionRepository;
  });

  it('returns null when there are no sets for the exercise (first time)', async () => {
    repo.setDataForExercise('ex-1', []);
    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    expect(result).toBeNull();
  });

  it('returns null when all sets belong to the active session', async () => {
    const set = makeWRSet('ex-1', 'active-session', 8, 80);
    repo.setDataForExercise('ex-1', [set]);
    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    expect(result).toBeNull();
  });

  it('queries only for the requested exerciseId — other exercises do not bleed through', async () => {
    // ex-1 has no history; ex-2 has history (should not affect ex-1 result)
    repo.setDataForExercise('ex-1', []);
    repo.setDataForExercise('ex-2', [makeWRSet('ex-2', 'prev-session', 10, 100)]);

    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    expect(result).toBeNull();
  });

  it('returns a target when there is a previous session with matching sets', async () => {
    const prev = makeWRSet('ex-1', 'prev-session', 8, 80, new Date('2026-01-01'));
    repo.setDataForExercise('ex-1', [prev]);
    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    expect(result).not.toBeNull();
    expect(result!.weightKg).toBe(82.5);
    expect(result!.reps).toBe(8);
  });

  it('correctly excludes active session and uses best set from most recent past session', async () => {
    const prev = makeWRSet('ex-1', 'prev-session', 8, 80, new Date('2026-01-01'));
    const activeSet = makeWRSet('ex-1', 'active-session', 10, 100, new Date('2026-01-02'));
    repo.setDataForExercise('ex-1', [prev, activeSet]);

    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    // Should be based on prev (80kg×8), not active set
    expect(result!.previousBest.weightKg).toBe(80);
    expect(result!.weightKg).toBe(82.5);
  });

  it('result previousBest.reps matches the actual best previous reps', async () => {
    const prev = makeWRSet('ex-1', 'prev-session', 6, 80, new Date('2026-01-01'));
    repo.setDataForExercise('ex-1', [prev]);
    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps');
    // reps=6 < targetReps=8 → same weight, reps+1
    expect(result!.weightKg).toBe(80);
    expect(result!.reps).toBe(7);
    expect(result!.previousBest.reps).toBe(6);
  });

  // ── Slice B: progresión en placas (incremento +1 entero) ──────────────────

  it('placas: reps >= objetivo → sube +1 placa (incremento entero, no 2.5)', async () => {
    // marca pasada: placa 5 × 12 (la magnitud de placa viaja en weight)
    const prev = makeWRSet('ex-1', 'prev-session', 12, 5, new Date('2026-01-01'));
    repo.setDataForExercise('ex-1', [prev]);
    const result = await useCase.execute('ex-1', 'active-session', 12, 'weight-reps', 'plates');
    expect(result).not.toBeNull();
    expect(result!.weightKg).toBe(6); // placa 5 + 1, NO 7.5
    expect(result!.reps).toBe(12);
    expect(result!.previousBest.weightKg).toBe(5);
  });

  it('placas: reps < objetivo → misma placa, +1 rep', async () => {
    const prev = makeWRSet('ex-1', 'prev-session', 10, 5, new Date('2026-01-01'));
    repo.setDataForExercise('ex-1', [prev]);
    const result = await useCase.execute('ex-1', 'active-session', 12, 'weight-reps', 'plates');
    expect(result!.weightKg).toBe(5); // misma placa
    expect(result!.reps).toBe(11); // 10 + 1
  });

  it('weightUnit "kg" (default) mantiene incremento 2.5 — progresión kg intacta', async () => {
    const prev = makeWRSet('ex-1', 'prev-session', 8, 80, new Date('2026-01-01'));
    repo.setDataForExercise('ex-1', [prev]);
    const result = await useCase.execute('ex-1', 'active-session', 8, 'weight-reps', 'kg');
    expect(result!.weightKg).toBe(82.5); // +2.5
  });
});
