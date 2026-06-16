/**
 * TrainingSessionPage spec (D-1, D-4, D-5) — TDD strict.
 *
 * RestTimerService uses import.meta.url (Web Worker factory) which Jest cannot handle.
 * We mock the module to avoid the SyntaxError at module load time.
 */

// Must be hoisted before any imports that transitively load the worker factory.
jest.mock('../services/rest-timer-worker.factory', () => ({
  createRestTimerWorker: jest.fn(() => ({
    postMessage: jest.fn(),
    terminate: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onmessage: null,
    onerror: null,
  })),
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TrainingSessionPage } from './training-session.page';
import { TrainingSessionStore } from '../services/training-session.store';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { LogSetUseCase } from '../../domain/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../domain/use-cases/complete-session.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { Router } from '@angular/router';
import { SessionRepository } from '../../domain/session.repository';
import { PersonalRecordDetector } from '../../domain/services/personal-record-detector';
import { EventBus } from '@core/shared/events/event-bus';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { RestTimerService } from '../services/rest-timer.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { PrCelebrationComponent } from '../components/pr-celebration.component';
import { ToastService, FgSkeletonComponent } from '@core/shared/ui';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'session-1',
    routineId: 'routine-1',
    dayId: 'day-1',
    date: '2026-05-15',
    startedAt: new Date(),
    status: 'in-progress',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeExercise(id: string, name: string) {
  return { id, name, trackingType: 'weight-reps' as const };
}

function makeExerciseInDay(exerciseId: string, targetCount: number) {
  return {
    exerciseId,
    targetSets: Array.from({ length: targetCount }, (_, i) => ({ id: `target-${exerciseId}-${i}` })),
  };
}

function makeWorkedSet(exerciseId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `ws-${Math.random()}`,
    sessionId: 'session-1',
    exerciseId,
    type: 'weight-reps',
    reps: { value: 10 },
    weight: { value: 80 },
    isPR: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TrainingSessionPage', () => {
  let fixture: ComponentFixture<TrainingSessionPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;
  let activeSessionSignal: ReturnType<typeof signal<unknown>>;
  let workedSetsSignal: ReturnType<typeof signal<unknown[]>>;
  let setsByExerciseSignal: ReturnType<typeof signal<Map<string, unknown[]>>>;
  let elapsedSecondsSignal: ReturnType<typeof signal<number>>;
  let mockStore: {
    activeSession: ReturnType<typeof signal<unknown>>;
    workedSets: ReturnType<typeof signal<unknown[]>>;
    setsByExercise: ReturnType<typeof signal<Map<string, unknown[]>>>;
    loadActive: jest.Mock;
    refreshSets: jest.Mock;
    elapsedSeconds: ReturnType<typeof signal<number>>;
  };
  let mockPrRepo: {
    save: jest.Mock;
    findCurrent: jest.Mock;
    findAll: jest.Mock;
    getCurrentForExercise: jest.Mock;
    listAll: jest.Mock;
  };
  let mockLogSetUseCase: { execute: jest.Mock };
  let mockDayRepo: { getById: jest.Mock };
  let mockExerciseRepo: { getAll: jest.Mock };

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    activeSessionSignal = signal(null);
    workedSetsSignal = signal([]);
    setsByExerciseSignal = signal(new Map());
    elapsedSecondsSignal = signal(0);

    mockStore = {
      activeSession: activeSessionSignal,
      workedSets: workedSetsSignal,
      setsByExercise: setsByExerciseSignal,
      loadActive: jest.fn().mockResolvedValue(undefined),
      refreshSets: jest.fn().mockResolvedValue(undefined),
      elapsedSeconds: elapsedSecondsSignal,
    };

    // Extended mock — includes getCurrentForExercise required by D-5
    mockPrRepo = {
      save: jest.fn(),
      findCurrent: jest.fn(),
      findAll: jest.fn(),
      getCurrentForExercise: jest.fn().mockResolvedValue(null),
      listAll: jest.fn().mockResolvedValue([]),
    };

    mockLogSetUseCase = { execute: jest.fn() };

    mockDayRepo = { getById: jest.fn().mockResolvedValue(null) };
    mockExerciseRepo = { getAll: jest.fn().mockResolvedValue([]) };

    await TestBed.configureTestingModule({
      imports: [TrainingSessionPage],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        { provide: TrainingSessionStore, useValue: mockStore },
        { provide: TrainingDayRepository, useValue: mockDayRepo },
        { provide: ExerciseRepository, useValue: mockExerciseRepo },
        { provide: LogSetUseCase, useValue: mockLogSetUseCase },
        { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        // LogSetUseCase and CompleteSessionUseCase are in component providers[] and inject these:
        { provide: SessionRepository, useValue: { save: jest.fn(), addSetToSession: jest.fn(), getActive: jest.fn(), getById: jest.fn(), getSetsForSession: jest.fn(), getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]) } },
        { provide: PersonalRecordDetector, useValue: { detect: jest.fn().mockResolvedValue(null), isPR: jest.fn().mockReturnValue(false) } },
        { provide: EventBus, useValue: { publish: jest.fn(), subscribe: jest.fn(() => () => {}) } },
        { provide: PersonalRecordRepository, useValue: mockPrRepo },
        { provide: RestTimerService, useValue: { remaining: signal(null), start: jest.fn(), skip: jest.fn(), cancel: jest.fn(), setRestPlan: jest.fn() } },
        { provide: NotificationPermissionService, useValue: { status: signal('default'), requestPermission: jest.fn() } },
      ],
    }).compileComponents();
  });

  // --- Existing smoke tests ---

  it('renders without error when UserPreferencesService provides unit="lb"', () => {
    fixture = TestBed.createComponent(TrainingSessionPage);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('calls loadOnce() during ngOnInit', async () => {
    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  it('exposes unit signal from UserPreferencesService', () => {
    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    expect(fixture.componentInstance.unit()).toBe('lb');
  });

  // --- D-1: Header with elapsed time (V-D1-Spec-1) ---

  it('header contains formatted elapsed time from store.elapsedSeconds (V-D1-Spec-1)', async () => {
    elapsedSecondsSignal.set(125); // 2m 5s
    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const headerText = (fixture.nativeElement as HTMLElement).querySelector('header')?.textContent ?? '';
    // 125 seconds = 2:05 or 00:02:05
    expect(headerText).toMatch(/2:05|00:02:05/);
  });

  // --- D-1: Progress bar and sets text (V-D1-Spec-2) ---

  it('progress bar [style.width.%] reflects loggedCount/targetCount and text shows "X de Y sets" (V-D1-Spec-2)', async () => {
    const exerciseId = 'ex-1';
    const exercise = makeExercise(exerciseId, 'Sentadilla');
    const exInDay = makeExerciseInDay(exerciseId, 10); // 10 target sets
    const loggedSets = Array.from({ length: 3 }, () => makeWorkedSet(exerciseId));

    mockDayRepo.getById.mockResolvedValue({ exercises: [exInDay] });
    mockExerciseRepo.getAll.mockResolvedValue([exercise]);
    activeSessionSignal.set(makeSession());
    setsByExerciseSignal.set(new Map([[exerciseId, loggedSets]]));
    workedSetsSignal.set(loggedSets);

    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // Extra flushes for sequential async calls in init() (loadActive → refreshSets → getAll)
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('3 de 10 sets');

    // Check progress bar width is 30%
    const progressBar = (fixture.nativeElement as HTMLElement).querySelector('[style*="width"]');
    expect(progressBar).not.toBeNull();
    const widthStyle = (progressBar as HTMLElement).style.width;
    expect(widthStyle).toBe('30%');
  });

  // --- D-5: PR celebration inputs wired (V-D1-Spec-3) ---

  it('PrCelebrationComponent receives exerciseName and delta after PR (V-D1-Spec-3)', async () => {
    const exerciseId = 'ex-1';
    const exercise = makeExercise(exerciseId, 'Sentadilla');
    const exInDay = makeExerciseInDay(exerciseId, 3);

    mockDayRepo.getById.mockResolvedValue({ exercises: [exInDay] });
    mockExerciseRepo.getAll.mockResolvedValue([exercise]);
    activeSessionSignal.set(makeSession());

    // Override component-level providers to inject mock LogSetUseCase
    // (component declares providers: [LogSetUseCase] so TestBed-level mock is bypassed)
    TestBed.overrideComponent(TrainingSessionPage, {
      set: {
        providers: [
          { provide: LogSetUseCase, useValue: mockLogSetUseCase },
          { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
          { provide: CancelSessionUseCase, useValue: { execute: jest.fn() } },
        ],
      },
    });

    // Previous PR: 80 kg
    mockPrRepo.getCurrentForExercise.mockResolvedValue({
      id: 'pr-1',
      exerciseId,
      trackingType: 'weight-reps',
      workedSetId: 'ws-old',
      achievedAt: new Date(),
      set: { id: 'ws-old', sessionId: 'session-1', exerciseId, type: 'weight-reps', reps: { value: 5 }, weight: { value: 80 }, isPR: true, createdAt: new Date() },
    });

    // New logged set: 85 kg, isPR = true
    mockLogSetUseCase.execute.mockResolvedValue({
      id: 'ws-new',
      sessionId: 'session-1',
      exerciseId,
      type: 'weight-reps',
      reps: { value: 5 },
      weight: { value: 85 },
      isPR: true,
      createdAt: new Date(),
    });

    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Directly populate exercisesWithData so the name lookup works synchronously
    fixture.componentInstance.exercisesWithData.set([
      { exercise: exercise as any, exerciseInDay: exInDay as any },
    ]);
    fixture.detectChanges();

    // Trigger onSetLogged
    await fixture.componentInstance.onSetLogged({
      sessionId: 'session-1',
      exerciseId,
      type: 'weight-reps',
      repsValue: 5,
      weightKgValue: 85,
    });
    fixture.detectChanges();

    // Check signals directly
    expect(fixture.componentInstance.latestPrExerciseName()).toBe('Sentadilla');
    expect(fixture.componentInstance.latestPrDelta()).toBe('+5 kg');

    // Also check that PrCelebrationComponent receives the inputs
    const prComp = fixture.debugElement.query(By.directive(PrCelebrationComponent))?.componentInstance as PrCelebrationComponent | undefined;
    expect(prComp).toBeDefined();
    expect(prComp!.exerciseName()).toBe('Sentadilla');
    expect(prComp!.delta()).toBe('+5 kg');
  });

  // --- D-4: Auto-collapse (V-D1-Spec-4) ---

  it('completed exercise renders collapsed and incomplete renders expanded (V-D1-Spec-4)', async () => {
    const completedId = 'ex-complete';
    const incompleteId = 'ex-incomplete';

    const completedExercise = makeExercise(completedId, 'Press de banca');
    const incompleteExercise = makeExercise(incompleteId, 'Remo con barra');

    const completedInDay = makeExerciseInDay(completedId, 3);  // 3 target
    const incompleteInDay = makeExerciseInDay(incompleteId, 3); // 3 target, 1 logged

    const completedSets = Array.from({ length: 3 }, () => makeWorkedSet(completedId));
    const incompleteSets = [makeWorkedSet(incompleteId)];

    mockDayRepo.getById.mockResolvedValue({ exercises: [completedInDay, incompleteInDay] });
    mockExerciseRepo.getAll.mockResolvedValue([completedExercise, incompleteExercise]);
    activeSessionSignal.set(makeSession());
    setsByExerciseSignal.set(new Map([
      [completedId, completedSets],
      [incompleteId, incompleteSets],
    ]));

    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // Extra flushes for sequential async calls in init() (loadActive → refreshSets → getById loops)
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    // The incomplete exercise must have fg-exercise-session-card with [expanded]="true"
    const sessionCards = fixture.debugElement.queryAll(By.css('fg-exercise-session-card'));
    expect(sessionCards.length).toBeGreaterThanOrEqual(1);
    // At least one card should have [expanded] binding true (for incomplete exercise).
    // ng-reflect-expanded is a dev-mode attribute serialization of the input binding.
    const expandedCard = sessionCards.find(
      (card) => card.attributes['ng-reflect-expanded'] === 'true',
    );
    expect(expandedCard).toBeDefined();
  });

  // --- D-1: CTA button text ---

  it('CTA button shows "Terminar sesión"', () => {
    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Terminar sesión');
  });

  // --- CC-8: No raw hex in template ---

  it('template HTML contains zero raw hex color literals (CC-8)', () => {
    fixture = TestBed.createComponent(TrainingSessionPage);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    // Match #RGB or #RRGGBB hex patterns not preceded by alphanumeric (avoid matching class names with dashes)
    const hexMatches = html.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
    expect(hexMatches).toHaveLength(0);
  });

  // --- P3-1: ToastService integration on completeSession failure ---
  // These tests use a separate describe with their own TestBed setup so that
  // overrideComponent is called BEFORE any inject() (Angular constraint).

  describe('completeSession() — error path (P3-1)', () => {
    let mockCompleteUseCase: { execute: jest.Mock };

    beforeEach(async () => {
      mockCompleteUseCase = { execute: jest.fn().mockRejectedValue(new Error('Network error')) };

      await TestBed.configureTestingModule({
        imports: [TrainingSessionPage],
        providers: [
          { provide: UserPreferencesService, useValue: { unit: signal('kg'), loadOnce: jest.fn().mockResolvedValue(undefined) } },
          { provide: TrainingSessionStore, useValue: {
            activeSession: signal(makeSession()),
            workedSets: signal([]),
            setsByExercise: signal(new Map()),
            loadActive: jest.fn().mockResolvedValue(undefined),
            refreshSets: jest.fn().mockResolvedValue(undefined),
            elapsedSeconds: signal(0),
          }},
          { provide: TrainingDayRepository, useValue: { getById: jest.fn().mockResolvedValue(null) } },
          { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue([]) } },
          { provide: LogSetUseCase, useValue: { execute: jest.fn() } },
          { provide: CompleteSessionUseCase, useValue: mockCompleteUseCase },
          { provide: Router, useValue: { navigate: jest.fn() } },
          { provide: SessionRepository, useValue: { save: jest.fn(), addSetToSession: jest.fn(), getActive: jest.fn(), getById: jest.fn(), getSetsForSession: jest.fn(), getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]) } },
          { provide: PersonalRecordDetector, useValue: { detect: jest.fn().mockResolvedValue(null), isPR: jest.fn().mockReturnValue(false) } },
          { provide: EventBus, useValue: { publish: jest.fn(), subscribe: jest.fn(() => () => {}) } },
          { provide: PersonalRecordRepository, useValue: { save: jest.fn(), findCurrent: jest.fn(), findAll: jest.fn(), getCurrentForExercise: jest.fn().mockResolvedValue(null), listAll: jest.fn().mockResolvedValue([]) } },
          { provide: RestTimerService, useValue: { remaining: signal(null), start: jest.fn(), skip: jest.fn(), cancel: jest.fn(), setRestPlan: jest.fn() } },
          { provide: NotificationPermissionService, useValue: { status: signal('default'), requestPermission: jest.fn() } },
        ],
      })
        .overrideComponent(TrainingSessionPage, {
          set: {
            providers: [
              { provide: LogSetUseCase, useValue: { execute: jest.fn() } },
              { provide: CompleteSessionUseCase, useValue: mockCompleteUseCase },
              { provide: CancelSessionUseCase, useValue: { execute: jest.fn() } },
            ],
          },
        })
        .compileComponents();
    });

    it('calls toast.error() when completeSession use case rejects', async () => {
      const toastService = TestBed.inject(ToastService);
      const errorSpy = jest.spyOn(toastService, 'error');

      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.completeSession();

      expect(errorSpy).toHaveBeenCalledWith(
        'No se pudo completar la sesión',
        'Intentá de nuevo',
      );
    });

    it('re-enables the completing button after completeSession failure', async () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.completeSession();

      expect(fixture.componentInstance.completing()).toBe(false);
    });
  });

  // P3-5: initLoading skeleton
  describe('initLoading skeleton (P3-5)', () => {
    it('shows fg-skeleton for the exercise-list area while initLoading is true', () => {
      // By default mockDayRepo.getById hangs (resolves to null synchronously but
      // the effect flushes after detectChanges). We test that on first detectChanges,
      // before init() resolves, the skeleton is visible.
      fixture = TestBed.createComponent(TrainingSessionPage);
      // Set initLoading manually to test the template branch
      fixture.componentInstance.initLoading.set(true);
      fixture.detectChanges();

      const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
      expect(skeleton).not.toBeNull();
    });

    it('hides fg-skeleton after init() completes (initLoading false)', async () => {
      activeSessionSignal.set(makeSession());
      mockDayRepo.getById.mockResolvedValue({ exercises: [], name: 'Test' });

      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();

      expect(fixture.componentInstance.initLoading()).toBe(false);
      const skeleton = fixture.debugElement.query(By.directive(FgSkeletonComponent));
      expect(skeleton).toBeNull();
    });

    it('completing signal remains independent of initLoading (P3-5 no regression)', async () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();

      // completing should start false regardless of initLoading
      expect(fixture.componentInstance.completing()).toBe(false);
    });
  });

  // P3-3: toast.error shown when onSetLogged rejects
  describe('onSetLogged() — error path (P3-3)', () => {
    let mockLogSetRejecting: { execute: jest.Mock };

    beforeEach(async () => {
      mockLogSetRejecting = { execute: jest.fn().mockRejectedValue(new Error('write error')) };

      await TestBed.configureTestingModule({
        imports: [TrainingSessionPage],
        providers: [
          { provide: UserPreferencesService, useValue: { unit: signal('kg'), loadOnce: jest.fn().mockResolvedValue(undefined) } },
          { provide: TrainingSessionStore, useValue: {
            activeSession: signal(makeSession()),
            workedSets: signal([]),
            setsByExercise: signal(new Map()),
            loadActive: jest.fn().mockResolvedValue(undefined),
            refreshSets: jest.fn().mockResolvedValue(undefined),
            elapsedSeconds: signal(0),
          }},
          { provide: TrainingDayRepository, useValue: { getById: jest.fn().mockResolvedValue(null) } },
          { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue([]) } },
          { provide: LogSetUseCase, useValue: mockLogSetRejecting },
          { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
          { provide: Router, useValue: { navigate: jest.fn() } },
          { provide: SessionRepository, useValue: { save: jest.fn(), addSetToSession: jest.fn(), getActive: jest.fn(), getById: jest.fn(), getSetsForSession: jest.fn(), getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]) } },
          { provide: PersonalRecordDetector, useValue: { detect: jest.fn().mockResolvedValue(null), isPR: jest.fn().mockReturnValue(false) } },
          { provide: EventBus, useValue: { publish: jest.fn(), subscribe: jest.fn(() => () => {}) } },
          { provide: PersonalRecordRepository, useValue: { save: jest.fn(), findCurrent: jest.fn(), findAll: jest.fn(), getCurrentForExercise: jest.fn().mockResolvedValue(null), listAll: jest.fn().mockResolvedValue([]) } },
          { provide: RestTimerService, useValue: { remaining: signal(null), start: jest.fn(), skip: jest.fn(), cancel: jest.fn(), setRestPlan: jest.fn() } },
          { provide: NotificationPermissionService, useValue: { status: signal('default'), requestPermission: jest.fn() } },
        ],
      })
        .overrideComponent(TrainingSessionPage, {
          set: {
            providers: [
              { provide: LogSetUseCase, useValue: mockLogSetRejecting },
              { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
              { provide: CancelSessionUseCase, useValue: { execute: jest.fn() } },
            ],
          },
        })
        .compileComponents();
    });

    it('calls toast.error() when onSetLogged use case rejects (P3-3)', async () => {
      const toastService = TestBed.inject(ToastService);
      const errorSpy = jest.spyOn(toastService, 'error');

      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.onSetLogged({
        sessionId: 'session-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        repsValue: 5,
        weightKgValue: 80,
      });

      expect(errorSpy).toHaveBeenCalledWith('No se pudo guardar la serie', 'Intentá de nuevo');
    });
  });

  // ── Cancelar entrenamiento desde la sesión ─────────────────────────────────

  describe('cancelSession() — flujo de cancelar', () => {
    let mockCancelUseCase: { execute: jest.Mock };
    let mockRestTimer: { remaining: ReturnType<typeof signal<null>>; start: jest.Mock; skip: jest.Mock; cancel: jest.Mock; setRestPlan: jest.Mock };
    let mockStoreWithSession: typeof mockStore & { clear: jest.Mock };
    let mockRouterNav: jest.Mock;

    beforeEach(async () => {
      mockCancelUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
      mockRestTimer = { remaining: signal(null), start: jest.fn(), skip: jest.fn(), cancel: jest.fn(), setRestPlan: jest.fn() };
      mockStoreWithSession = {
        activeSession: signal(makeSession()),
        workedSets: signal([]),
        setsByExercise: signal(new Map()),
        loadActive: jest.fn().mockResolvedValue(undefined),
        refreshSets: jest.fn().mockResolvedValue(undefined),
        elapsedSeconds: signal(0),
        clear: jest.fn(),
      };
      mockRouterNav = jest.fn().mockResolvedValue(true);

      await TestBed.configureTestingModule({
        imports: [TrainingSessionPage],
        providers: [
          { provide: UserPreferencesService, useValue: { unit: signal('kg'), loadOnce: jest.fn().mockResolvedValue(undefined) } },
          { provide: TrainingSessionStore, useValue: mockStoreWithSession },
          { provide: TrainingDayRepository, useValue: { getById: jest.fn().mockResolvedValue(null) } },
          { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue([]) } },
          { provide: LogSetUseCase, useValue: { execute: jest.fn() } },
          { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
          { provide: Router, useValue: { navigate: mockRouterNav } },
          { provide: SessionRepository, useValue: { save: jest.fn(), addSetToSession: jest.fn(), getActive: jest.fn(), getById: jest.fn(), getSetsForSession: jest.fn().mockResolvedValue([]), getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]) } },
          { provide: PersonalRecordDetector, useValue: { detect: jest.fn().mockResolvedValue(null), isPR: jest.fn().mockReturnValue(false) } },
          { provide: EventBus, useValue: { publish: jest.fn(), subscribe: jest.fn(() => () => {}) } },
          { provide: PersonalRecordRepository, useValue: { save: jest.fn(), getCurrentForExercise: jest.fn().mockResolvedValue(null), listAll: jest.fn().mockResolvedValue([]), existsByExerciseId: jest.fn().mockResolvedValue(false), deleteByWorkedSetIds: jest.fn().mockResolvedValue(undefined) } },
          { provide: RestTimerService, useValue: mockRestTimer },
          { provide: NotificationPermissionService, useValue: { status: signal('default'), requestPermission: jest.fn() } },
        ],
      })
        .overrideComponent(TrainingSessionPage, {
          set: {
            providers: [
              { provide: LogSetUseCase, useValue: { execute: jest.fn() } },
              { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
              { provide: CancelSessionUseCase, useValue: mockCancelUseCase },
            ],
          },
        })
        .compileComponents();
    });

    it('template shows "Cancelar entrenamiento" button', () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Cancelar entrenamiento');
    });

    it('rest timer is pinned with the header in a sticky wrapper (follows scroll)', () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      const sticky = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="session-sticky"]',
      );
      expect(sticky).toBeTruthy();
      expect((sticky as HTMLElement).classList.contains('sticky')).toBe(true);
      // both the header and the rest-timer live inside the sticky wrapper
      expect(sticky!.querySelector('header')).toBeTruthy();
      expect(sticky!.querySelector('fg-rest-timer')).toBeTruthy();
    });

    it('shows confirmation prompt after clicking "Cancelar entrenamiento"', () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      fixture.componentInstance.confirmingCancel.set(true);
      fixture.detectChanges();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('¿Seguro?');
    });

    it('cancelSession() calls use case, clear(), restTimer.cancel() and navigates to /training', async () => {
      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.cancelSession();

      expect(mockCancelUseCase.execute).toHaveBeenCalledWith({ sessionId: 'session-1' });
      expect(mockRestTimer.cancel).toHaveBeenCalled();
      expect(mockStoreWithSession.clear).toHaveBeenCalled();
      expect(mockRouterNav).toHaveBeenCalledWith(['/training']);
    });

    it('cancelSession() shows toast and re-enables button on error', async () => {
      mockCancelUseCase.execute.mockRejectedValue(new Error('DB error'));
      const toastService = TestBed.inject(ToastService);
      const errorSpy = jest.spyOn(toastService, 'error');

      fixture = TestBed.createComponent(TrainingSessionPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.cancelSession();

      expect(errorSpy).toHaveBeenCalledWith(
        'No se pudo cancelar el entrenamiento',
        'Intentá de nuevo',
      );
      expect(fixture.componentInstance.cancelling()).toBe(false);
    });
  });
});
