/**
 * SessionSummaryPage spec (D-2) — TDD strict.
 * Verifies volume hero, 4-stat grid, PR section, per-exercise breakdown.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SessionSummaryPage } from './session-summary.page';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { Session } from '../../domain/session.entity';
import type { WorkedSet } from '../../domain/worked-set';
import { Router } from '@angular/router';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const completedSession: Session = {
  id: 's-1',
  routineId: 'r-1',
  dayId: 'd-1',
  date: '2026-01-01',
  status: 'completed',
  startedAt: new Date('2026-01-01T09:00:00Z'),
  endedAt: new Date('2026-01-01T10:00:00Z'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function makeWeightRepsSet(id: string, exerciseId: string, weightKg: number, reps: number, isPR = false): WorkedSet {
  return {
    id,
    sessionId: 's-1',
    exerciseId,
    type: 'weight-reps',
    reps: { value: reps } as any,
    weight: { value: weightKg } as any,
    isPR,
    createdAt: new Date('2026-01-01'),
  } as WorkedSet;
}

function makeBodyweightSet(id: string, exerciseId: string, reps: number): WorkedSet {
  return {
    id,
    sessionId: 's-1',
    exerciseId,
    type: 'bodyweight-reps',
    reps: { value: reps } as any,
    isPR: false,
    createdAt: new Date('2026-01-01'),
  } as WorkedSet;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SessionSummaryPage', () => {
  let fixture: ComponentFixture<SessionSummaryPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;
  let activeSessionSignal: ReturnType<typeof signal<Session | null>>;
  let mockSessionRepo: { getById: jest.Mock; getSetsForSession: jest.Mock };
  let mockPrRepo: { listAll: jest.Mock; getCurrentForExercise: jest.Mock; save: jest.Mock; getById: jest.Mock };
  let mockExerciseRepo: { getAll: jest.Mock };

  interface SetupOptions {
    exercises?: { id: string; name: string }[];
  }

  async function setup(workedSets: WorkedSet[], session: Session = completedSession, opts: SetupOptions = {}): Promise<void> {
    // Always reset before re-configuring (prevents state leak between tests)
    TestBed.resetTestingModule();

    unitSignal = signal<PreferredUnit>('kg');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);
    activeSessionSignal = signal<Session | null>(session);

    mockSessionRepo = {
      getById: jest.fn().mockResolvedValue(session),
      getSetsForSession: jest.fn().mockResolvedValue(workedSets),
    };

    mockPrRepo = {
      listAll: jest.fn().mockResolvedValue([]),
      getCurrentForExercise: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      getById: jest.fn().mockResolvedValue(null),
    };

    mockExerciseRepo = {
      getAll: jest.fn().mockResolvedValue(opts.exercises ?? []),
    };

    await TestBed.configureTestingModule({
      imports: [SessionSummaryPage],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        { provide: TrainingSessionStore, useValue: { activeSession: activeSessionSignal, workedSets: signal(workedSets), setsByExercise: signal(new Map()) } },
        { provide: SessionRepository, useValue: mockSessionRepo },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: PersonalRecordRepository, useValue: mockPrRepo },
        { provide: ExerciseRepository, useValue: mockExerciseRepo },
      ],
    }).compileComponents();
  }

  // --- V-D2-Spec-1: Volume hero ---

  it('volume hero displays computed weight-reps sum (V-D2-Spec-1)', async () => {
    // 2 sets: 80kg × 10 reps = 800, 80kg × 10 reps = 800 → total 1600
    const workedSets = [
      makeWeightRepsSet('ws-1', 'ex-1', 80, 10),
      makeWeightRepsSet('ws-2', 'ex-1', 80, 10),
    ];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // 1600 kg — use regex to avoid locale separator variance (Risk #3: jsdom may use ',' or '.')
    expect(text).toMatch(/1[.,]?600/);
  });

  it('volume hero shows "Sin volumen registrado" for bodyweight-only session (V-D2-Spec-1 edge)', async () => {
    const workedSets = [makeBodyweightSet('ws-1', 'ex-1', 15)];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sin volumen registrado');
  });

  // --- V-D2-Spec-2: 4-stat grid ---

  it('renders 4 stat tiles and avg-rest tile shows "—" (V-D2-Spec-2)', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 80, 10)];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // 4 stat labels must be present
    expect(text).toContain('Sets');
    expect(text).toContain('Reps totales');
    expect(text).toContain('Duración');
    expect(text).toContain('Descanso prom.');
    // avg-rest shows em dash
    expect(text).toContain('—');
  });

  // --- V-D2-Spec-3: PR section shows delta chip ---

  it('PR section shows delta chip "+5 kg" when previousPR exists (V-D2-Spec-3)', async () => {
    const prSet = makeWeightRepsSet('ws-pr', 'ex-1', 85, 5, true);
    const workedSets = [prSet];

    // The new PR (ws-pr, 85kg) is already saved. The previous PR (80 kg) is older.
    // listAll returns them ordered by achievedAt desc: [newPR, previousPR]
    const newPRRecord = {
      id: 'pr-new',
      exerciseId: 'ex-1',
      trackingType: 'weight-reps',
      workedSetId: 'ws-pr',
      achievedAt: new Date('2026-01-01T09:30:00Z'), // during session
      set: prSet,
    };
    const previousPRRecord = {
      id: 'pr-old',
      exerciseId: 'ex-1',
      trackingType: 'weight-reps',
      workedSetId: 'ws-old',
      achievedAt: new Date('2026-01-01T08:00:00Z'), // before session
      set: makeWeightRepsSet('ws-old', 'ex-1', 80, 5, true),
    };

    await setup(workedSets);
    // index[0]=new (current session), index[1]=previous — summary picks index[1] as "prev"
    mockPrRepo.listAll.mockResolvedValue([newPRRecord, previousPRRecord]);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('+5 kg');
  });

  // --- V-D2-Spec-4: Per-exercise breakdown groups sets ---

  it('breakdown renders one card per exercise with correct set count (V-D2-Spec-4)', async () => {
    const ex1sets = [
      makeWeightRepsSet('ws-1', 'ex-1', 80, 10),
      makeWeightRepsSet('ws-2', 'ex-1', 80, 10),
      makeWeightRepsSet('ws-3', 'ex-1', 80, 10),
    ];
    const ex2sets = [
      makeWeightRepsSet('ws-4', 'ex-2', 60, 12),
      makeWeightRepsSet('ws-5', 'ex-2', 60, 12),
      makeWeightRepsSet('ws-6', 'ex-2', 60, 12),
    ];
    const workedSets = [...ex1sets, ...ex2sets];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    // 2 exercise groups — assert that the page shows 2 exercise rows
    const rows = fixture.componentInstance.exerciseRows();
    expect(rows).toHaveLength(2);
    // Each group should have 3 sets
    expect(rows.find((r) => r.exerciseId === 'ex-1')?.sets).toBe(3);
    expect(rows.find((r) => r.exerciseId === 'ex-2')?.sets).toBe(3);
  });

  // --- CTA button text ---

  it('CTA button shows "Guardar y cerrar"', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Guardar y cerrar');
  });

  // --- V-D2-Spec-5: Exercise names resolved from ExerciseRepository (#585) ---

  it('breakdown shows exercise NAME not raw UUID when ExerciseRepository provides it (V-D2-Spec-5)', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 80, 10)];
    await setup(workedSets, completedSession, {
      exercises: [{ id: 'ex-1', name: 'Sentadilla' }],
    });

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sentadilla');
    expect(text).not.toContain('ex-1');
  });

  // --- CC-8: No raw hex in template ---

  it('template HTML contains zero raw hex color literals (CC-8)', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    const hexMatches = html.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
    expect(hexMatches).toHaveLength(0);
  });

  // --- Existing unit tests (preserved) ---

  it('calls loadOnce() during ngOnInit', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await Promise.resolve();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  it('renders weight-reps set with unit="lb" showing lb value', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 100, 5)];
    await setup(workedSets);
    unitSignal.set('lb');

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('renders weight-reps set with unit="kg" showing kg value (default)', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 100, 5)];
    await setup(workedSets);
    unitSignal.set('kg');

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });
});
