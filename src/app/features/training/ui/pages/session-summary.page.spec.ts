/**
 * SessionSummaryPage spec (D-2) — TDD strict.
 * Verifies volume hero, 4-stat grid, PR section, per-exercise breakdown.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SessionSummaryPage } from './session-summary.page';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { ToastService, FgSkeletonComponent } from '@core/shared/ui';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { Session } from '../../domain/session.entity';
import type { WorkedSet } from '../../domain/worked-set';
import { Router } from '@angular/router';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { GetPreviousSessionSetsUseCase } from '../../domain/use-cases/get-previous-session-sets.use-case';

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
  let mockDayRepo: { getById: jest.Mock };
  let mockPreviousSets: { execute: jest.Mock };

  interface SetupOptions {
    exercises?: { id: string; name: string }[];
    /** Sets of the previous session, by exerciseId. */
    previousSets?: Record<string, WorkedSet[]>;
    dayName?: string | null;
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

    mockDayRepo = {
      getById: jest.fn().mockResolvedValue(opts.dayName === null ? null : { id: 'd-1', name: opts.dayName ?? 'Pierna B' }),
    };

    mockPreviousSets = {
      execute: jest.fn().mockImplementation(async (exerciseId: string) => opts.previousSets?.[exerciseId] ?? []),
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
        { provide: TrainingDayRepository, useValue: mockDayRepo },
      ],
    })
      .overrideComponent(SessionSummaryPage, {
        set: { providers: [{ provide: GetPreviousSessionSetsUseCase, useValue: mockPreviousSets }] },
      })
      .compileComponents();
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
    for (let i = 0; i < 10; i++) await Promise.resolve();
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
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sin volumen registrado');
  });

  // --- V-D2-Spec-2: totals (Cuaderno: Duración, Volumen, Series, Reps) ---

  it('renders the 4 totals of the canvas and drops the empty "Descanso prom." tile (V-D2-Spec-2)', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 80, 10)];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const totals = (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Totales"]')!;
    const labels = Array.from(totals.querySelectorAll('[data-total-label]')).map((e) => e.textContent?.trim());
    expect(labels).toEqual(['Duración', 'Volumen', 'Series', 'Reps']);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Descanso prom.');
  });

  it('formats the duration as mm:ss and shows volume, sets and reps in mono tiles', async () => {
    const session: Session = {
      ...completedSession,
      startedAt: new Date(2026, 9, 27, 18, 5, 0),
      endedAt: new Date(2026, 9, 27, 19, 3, 12),
    };
    const workedSets = [
      makeWeightRepsSet('ws-1', 'ex-1', 100, 10),
      makeWeightRepsSet('ws-2', 'ex-1', 100, 10),
    ];
    await setup(workedSets, session);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const values = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[aria-label="Totales"] [data-total-value]'),
    );
    expect(values.map((e) => e.textContent?.trim())).toEqual([
      '58:12',
      // Intl.NumberFormat sin locale (como antes de T5): el separador depende del entorno.
      expect.stringMatching(/^2[.,]000$/),
      '2',
      '20',
    ]);
    expect(values.every((e) => e.classList.contains('font-mono'))).toBe(true);
  });

  // --- Cuaderno header ---

  it('header shows "Sesión terminada", the day name as title and the date with start-end hours', async () => {
    const session: Session = {
      ...completedSession,
      startedAt: new Date(2026, 9, 27, 18, 5, 0),
      endedAt: new Date(2026, 9, 27, 19, 3, 12),
    };
    await setup([makeWeightRepsSet('ws-1', 'ex-1', 80, 10)], session, { dayName: 'Pierna B' });

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')?.textContent).toContain('Sesión terminada');
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Pierna B');
    expect(el.querySelector('[data-session-when]')?.textContent?.trim()).toBe('mar 27 oct · 18:05–19:03');
  });

  it('close button is labelled "Cerrar resumen" and goes home', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Cerrar resumen"]');
    expect(btn).not.toBeNull();
    btn!.click();
    const router = TestBed.inject(Router) as unknown as { navigate: jest.Mock };
    expect(router.navigate).toHaveBeenCalledWith(['/training']);
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

  it('PR card follows the accent color: "Récord nuevo · <ejercicio>", border-accent, no pr-warm', async () => {
    const prSet = makeWeightRepsSet('ws-pr', 'ex-1', 102.5, 7, true);
    await setup([prSet], completedSession, { exercises: [{ id: 'ex-1', name: 'Sentadilla' }] });

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelector<HTMLElement>('[data-pr-card]')!;
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('Récord nuevo · Sentadilla');
    expect(card.textContent).toContain('102.5 kg × 7');
    expect(card.classList.contains('border-accent')).toBe(true);
    expect(card.querySelector('.text-accent-ink')).not.toBeNull();
    expect(card.querySelector('.bg-accent.text-accent-on')).not.toBeNull();
    expect(el.innerHTML).not.toMatch(/pr-warm/);
  });

  it('does not render a PR card when the session has no records', async () => {
    await setup([makeWeightRepsSet('ws-1', 'ex-1', 80, 10)]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-pr-card]')).toBeNull();
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

  // --- Cuaderno: tabla "Ejercicio por ejercicio" ---

  it('per-exercise table shows series, best set and the change versus the previous session', async () => {
    const workedSets = [
      makeWeightRepsSet('ws-1', 'ex-1', 100, 5),
      makeWeightRepsSet('ws-2', 'ex-1', 102.5, 7),
      makeWeightRepsSet('ws-3', 'ex-2', 140, 5),
      makeWeightRepsSet('ws-4', 'ex-3', 60, 10),
    ];
    const prev = (exerciseId: string, kg: number): WorkedSet => ({
      ...makeWeightRepsSet(`p-${exerciseId}`, exerciseId, kg, 5),
      sessionId: 's-0',
    });
    await setup(workedSets, completedSession, {
      exercises: [
        { id: 'ex-1', name: 'Sentadilla' },
        { id: 'ex-2', name: 'Peso muerto' },
        { id: 'ex-3', name: 'Remo' },
      ],
      previousSets: { 'ex-1': [prev('ex-1', 100)], 'ex-2': [prev('ex-2', 140)] },
    });

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ejercicio por ejercicio');
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-exercise-row]'));
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Sentadilla');
    expect(rows[0].querySelector('[data-row-sets]')?.textContent?.trim()).toBe('2');
    expect(rows[0].querySelector('[data-row-best]')?.textContent?.trim()).toBe('102.5 kg×7');
    expect(rows[0].querySelector('[data-row-delta]')?.textContent?.trim()).toBe('+2.5 kg');
    expect(rows[1].querySelector('[data-row-delta]')?.textContent?.trim()).toBe('igual');
    // Sin sesión previa: no hay con qué comparar.
    expect(rows[2].querySelector('[data-row-delta]')?.textContent?.trim()).toBe('—');
  });

  it('shows "No se registraron series." when the session has no sets', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se registraron series.');
  });

  // --- Unidad preferida: todo peso pasa por DisplayWeightPipe ---

  it('lb: "Mejor", "vs. ant." and the PR detail/delta are converted with the display-weight format', async () => {
    const prSet = makeWeightRepsSet('ws-pr', 'ex-1', 102.5, 7, true);
    const prev: WorkedSet = { ...makeWeightRepsSet('p-1', 'ex-1', 100, 5), sessionId: 's-0' };
    await setup([prSet], completedSession, {
      exercises: [{ id: 'ex-1', name: 'Sentadilla' }],
      previousSets: { 'ex-1': [prev] },
    });
    unitSignal.set('lb');
    // Previous PR = 100 kg, so the PR delta is +2.5 kg.
    mockPrRepo.listAll.mockResolvedValue([
      { id: 'pr-new', exerciseId: 'ex-1', set: prSet },
      { id: 'pr-old', exerciseId: 'ex-1', set: prev },
    ]);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector<HTMLElement>('[data-exercise-row]')!;
    // 102.5 kg = 226.0 lb ; 2.5 kg = 5.5 lb
    expect(row.querySelector('[data-row-best]')?.textContent?.trim()).toBe('226.0 lb×7');
    expect(row.querySelector('[data-row-delta]')?.textContent?.trim()).toBe('+5.5 lb');
    const card = el.querySelector<HTMLElement>('[data-pr-card]')!;
    expect(card.textContent).toContain('226.0 lb × 7');
    expect(card.textContent).toContain('+5.5 lb vs. récord anterior');
    expect(el.textContent).not.toMatch(/\d,\d/);
  });

  it('lb: a lower best weight than the previous session shows a signed lb difference', async () => {
    const prev: WorkedSet = { ...makeWeightRepsSet('p-1', 'ex-1', 100, 5), sessionId: 's-0' };
    await setup([makeWeightRepsSet('ws-1', 'ex-1', 90, 5)], completedSession, {
      previousSets: { 'ex-1': [prev] },
    });
    unitSignal.set('lb');

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-exercise-row]')!;
    expect(row.querySelector('[data-row-best]')?.textContent?.trim()).toBe('198.4 lb×5');
    expect(row.querySelector('[data-row-delta]')?.textContent?.trim()).toBe('-22.0 lb');
  });

  it('distance uses the same decimal point as the rest of the app', async () => {
    const run = {
      id: 'ws-run', sessionId: 's-1', exerciseId: 'ex-1', type: 'distance-time',
      distanceKm: 5.5, durationSec: 1800, isPR: false, createdAt: new Date('2026-01-01'),
    } as WorkedSet;
    await setup([run]);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-exercise-row]')!;
    expect(row.querySelector('[data-row-best]')?.textContent?.trim()).toBe('5.5 km');
  });

  // --- CTA button text ---

  it('CTA button shows "Guardar sesión"', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Guardar sesión');
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

  it('uses only semantic tokens: no forge-*, accent-<n>, destructive-* (Cuaderno)', async () => {
    await setup([makeWeightRepsSet('ws-1', 'ex-1', 80, 10, true)]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).not.toMatch(/\bforge-\d/);
    expect(html).not.toMatch(/\baccent-\d/);
    expect(html).not.toMatch(/destructive-\d/);
    expect(html).not.toMatch(/--accent-|--pr-warm/);
  });

  // --- Existing unit tests (preserved) ---

  it('calls loadOnce() during ngOnInit', async () => {
    await setup([]);
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await Promise.resolve();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  // P3-3: toast.error shown when init() fails
  it('calls toast.error when sessionRepo.getById rejects (P3-3)', async () => {
    await setup([]);
    mockSessionRepo.getById.mockRejectedValue(new Error('db error'));

    const toastService = TestBed.inject(ToastService);
    const errorSpy = jest.spyOn(toastService, 'error');

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('No se pudo cargar el resumen', 'Intentá de nuevo');
  });

  it('renders weight-reps set with unit="lb" showing lb value', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 100, 5)];
    await setup(workedSets);
    unitSignal.set('lb');

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
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
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });

  // P3-5: loading skeleton

  it('shows fg-skeleton while loading is true (P3-5)', async () => {
    // Make sessionRepo.getById hang so loading stays true
    let resolveLoad!: (v: Session) => void;
    const pendingLoad = new Promise<Session>((res) => { resolveLoad = res; });

    await setup([]);
    mockSessionRepo.getById.mockReturnValue(pendingLoad);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    // Do NOT flush — loading should still be true

    const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
    expect(skeleton).not.toBeNull();

    resolveLoad(completedSession); // clean up
  });

  it('hides fg-skeleton and shows real content after load resolves (P3-5)', async () => {
    const workedSets = [makeWeightRepsSet('ws-1', 'ex-1', 80, 10)];
    await setup(workedSets);

    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
    expect(skeleton).toBeNull();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Series');
  });
});
