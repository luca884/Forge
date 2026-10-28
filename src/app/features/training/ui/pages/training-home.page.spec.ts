/**
 * TrainingHomePage spec — Slice 4A design-system-screens-training-home.
 * TDD strict — RED before implementation.
 * V-D1-Spec-1..8 + 2 extras.
 *
 * NOTE: TestBed.overrideComponent is REQUIRED because StartSessionUseCase,
 * GetActiveSessionUseCase, and GetSuggestedDayForTodayUseCase are declared
 * in component-level providers[]. Root-level providers do NOT override them.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TrainingHomePage } from './training-home.page';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { StartSessionUseCase } from '../../domain/use-cases/start-session.use-case';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { GetSuggestedDayForTodayUseCase } from '../../domain/use-cases/get-suggested-day-for-today.use-case';
import { CancelSessionUseCase } from '../../domain/use-cases/cancel-session.use-case';
import { GetLastWorkedSetForExerciseUseCase } from '../../domain/use-cases/get-last-worked-set-for-exercise.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { Session } from '../../domain/session.entity';
import type { WorkedSet } from '../../domain/worked-set';
import type { Routine } from '../../../routines/domain/routine.entity';
import type { TrainingDay } from '../../../routines/domain/training-day.entity';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockRoutine: Routine = {
  id: 'r-1',
  name: 'Fuerza total',
  description: 'Rutina de fuerza',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockDay: TrainingDay = {
  id: 'd-1',
  routineId: 'r-1',
  name: 'Piernas',
  label: 'A',
  exercises: [
    {
      exerciseId: 'ex-1',
      order: 0,
      targetSets: [
        { type: 'weight-reps', reps: 6, weightKg: 100 },
        { type: 'weight-reps', reps: 8, weightKg: 100 },
        { type: 'weight-reps', reps: 8, weightKg: 100 },
        { type: 'weight-reps', reps: 8, weightKg: 100 },
      ],
    },
    {
      exerciseId: 'ex-2',
      order: 1,
      targetSets: [
        { type: 'weight-reps', reps: 5, weightKg: 140 },
        { type: 'weight-reps', reps: 5, weightKg: 140 },
        { type: 'weight-reps', reps: 5, weightKg: 140 },
      ],
    },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const otherDay: TrainingDay = {
  id: 'd-2',
  routineId: 'r-1',
  name: 'Torso',
  label: 'B',
  exercises: [
    { exerciseId: 'ex-1', order: 0, targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 60 }] },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const exercises: { id: string; name: string; weightUnit?: 'kg' | 'plates'; plateWeightKg?: number }[] = [
  { id: 'ex-1', name: 'Sentadilla' },
  { id: 'ex-2', name: 'Peso muerto' },
];

function lastSet(exerciseId: string, kg: number, reps: number): WorkedSet {
  return {
    id: `ws-${exerciseId}`,
    sessionId: 's-prev',
    exerciseId,
    type: 'weight-reps',
    reps: { value: reps } as any,
    weight: { value: kg } as any,
    isPR: false,
    createdAt: new Date('2026-10-20'),
  } as WorkedSet;
}

function completedSession(id: string, date: string, dayId: string, minutes = 52): Session {
  const startedAt = new Date(`${date}T12:00:00`);
  return {
    id,
    routineId: 'r-1',
    dayId,
    date,
    status: 'completed',
    startedAt,
    endedAt: new Date(startedAt.getTime() + minutes * 60_000),
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

function weightSet(id: string, sessionId: string, kg: number, reps: number, isPR = false): WorkedSet {
  return {
    id,
    sessionId,
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: reps } as any,
    weight: { value: kg } as any,
    isPR,
    createdAt: new Date('2026-10-26'),
  } as WorkedSet;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('TrainingHomePage', () => {
  let fixture: ComponentFixture<TrainingHomePage>;
  let navigateSpy: jest.SpyInstance;
  let routineRepoMock: { getActive: jest.Mock };
  let trainingDayRepoMock: { getByRoutineId: jest.Mock; getById: jest.Mock };
  let startUCMock: { execute: jest.Mock };
  let activeSessionUCMock: { execute: jest.Mock };
  let suggestedUCMock: { execute: jest.Mock };
  let storeMock: { loadActive: jest.Mock; activeSession: ReturnType<typeof signal<null>>; clear: jest.Mock };
  let cancelUCMock: { execute: jest.Mock };
  let lastSetUCMock: { execute: jest.Mock };
  let sessionRepoMock: { getAllSessions: jest.Mock; getSetsForSession: jest.Mock };
  let unitSignal: WritableSignal<PreferredUnit>;
  let loadOnceMock: jest.Mock;

  async function setup(overrides: {
    routine?: Routine | null;
    days?: TrainingDay[];
    suggestedDay?: { day: TrainingDay | null; reason: string } | null;
    activeSession?: object | null;
    sessions?: Session[];
    setsBySession?: Record<string, WorkedSet[]>;
    exercises?: typeof exercises;
    /** Last logged set by exerciseId; defaults to 100 kg × 7 for ex-1 and none for the rest. */
    lastSets?: Record<string, WorkedSet>;
  } = {}): Promise<void> {
    const {
      routine = mockRoutine,
      days = [mockDay],
      suggestedDay = { day: mockDay, reason: 'scheduled' },
      activeSession = null,
      sessions = [],
      setsBySession = {},
      exercises: exerciseList = exercises,
      lastSets,
    } = overrides;

    routineRepoMock = { getActive: jest.fn().mockResolvedValue(routine) };
    trainingDayRepoMock = {
      getByRoutineId: jest.fn().mockResolvedValue(days),
      getById: jest.fn().mockImplementation(async (id: string) =>
        [mockDay, otherDay].find((d) => d.id === id) ?? mockDay,
      ),
    };
    startUCMock = { execute: jest.fn().mockResolvedValue(undefined) };
    activeSessionUCMock = { execute: jest.fn().mockResolvedValue(activeSession) };
    suggestedUCMock = { execute: jest.fn().mockResolvedValue(suggestedDay) };
    cancelUCMock = { execute: jest.fn().mockResolvedValue(undefined) };
    lastSetUCMock = {
      execute: jest.fn().mockImplementation(async (exerciseId: string) =>
        lastSets ? (lastSets[exerciseId] ?? null) : exerciseId === 'ex-1' ? lastSet('ex-1', 100, 7) : null,
      ),
    };
    sessionRepoMock = {
      getAllSessions: jest.fn().mockResolvedValue(sessions),
      getSetsForSession: jest.fn().mockImplementation(async (id: string) => setsBySession[id] ?? []),
    };
    storeMock = { loadActive: jest.fn().mockResolvedValue(undefined), activeSession: signal(null), clear: jest.fn() };
    unitSignal = signal<PreferredUnit>('kg');
    loadOnceMock = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [TrainingHomePage, RouterTestingModule],
      providers: [
        { provide: RoutineRepository, useValue: routineRepoMock },
        { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
        { provide: TrainingSessionStore, useValue: storeMock },
        { provide: SessionRepository, useValue: sessionRepoMock },
        { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue(exerciseList) } },
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceMock } },
      ],
    })
      .overrideComponent(TrainingHomePage, {
        set: {
          providers: [
            { provide: StartSessionUseCase, useValue: startUCMock },
            { provide: GetActiveSessionUseCase, useValue: activeSessionUCMock },
            { provide: GetSuggestedDayForTodayUseCase, useValue: suggestedUCMock },
            { provide: CancelSessionUseCase, useValue: cancelUCMock },
            { provide: GetLastWorkedSetForExerciseUseCase, useValue: lastSetUCMock },
          ],
        },
      })
      .compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(TrainingHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) await flushMicrotasks();
    fixture.detectChanges();
  }

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  // ── V-D1-Spec-2 ────────────────────────────────────────────────────────────
  it('renders fg-card[data-hero] when activeRoutine set and suggestedDay=scheduled', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const hero = (fixture.nativeElement as HTMLElement).querySelector('fg-card[data-hero]');
    expect(hero).not.toBeNull();
  });

  // ── V-D1-Spec-3 ────────────────────────────────────────────────────────────
  it('renders the start button with the canvas text "Empezá" and the accessible name "Empezar sesión de Piernas"', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[fg-button]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('Empezá');
    expect(btn!.getAttribute('aria-label')).toBe('Empezar sesión de Piernas');
  });

  // ── V-D1-Spec-4 branch 1: scheduled ───────────────────────────────────────
  it('shows day name in hero when reason=scheduled', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Piernas');
  });

  // ── V-D1-Spec-4 branch 2: rest-day ────────────────────────────────────────
  it('shows rest-day copy and no CTA when reason=rest-day', async () => {
    await setup({ suggestedDay: { day: null, reason: 'rest-day' } });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/descanso/i);
    const heroCta = (fixture.nativeElement as HTMLElement).querySelector(
      'fg-card[data-hero] button[fg-button]',
    );
    expect(heroCta).toBeNull();
  });

  // ── V-D1-Spec-4 branch 3: no-schedule-configured ──────────────────────────
  it('shows config prompt and no CTA when reason=no-schedule-configured', async () => {
    await setup({ suggestedDay: { day: null, reason: 'no-schedule-configured' } });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/configurá|configur/i);
    const heroCta = (fixture.nativeElement as HTMLElement).querySelector(
      'fg-card[data-hero] button[fg-button]',
    );
    expect(heroCta).toBeNull();
  });

  // ── V-D1-Spec-5 ────────────────────────────────────────────────────────────
  it('renders activeRoutine().name in routine card', async () => {
    await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Fuerza total');
  });

  // ── V-D1-Spec-6 ────────────────────────────────────────────────────────────
  it('renders exactly 7 [data-week-cell] elements', async () => {
    await setup();
    const cells = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-week-cell]');
    expect(cells.length).toBe(7);
  });

  // ── V-D1-Spec-7 ────────────────────────────────────────────────────────────
  it('calls Router.navigate with /training/session on CTA click', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'fg-card[data-hero] button[fg-button]',
    );
    expect(btn).not.toBeNull();
    if (!btn) return;
    btn.click();
    await fixture.whenStable();
    await flushMicrotasks();
    expect(navigateSpy).toHaveBeenCalledWith(['/training/session']);
  });

  // ── V-D1-Spec-8 ────────────────────────────────────────────────────────────
  it('renders empty-state when activeRoutine is null', async () => {
    await setup({ routine: null, days: [], suggestedDay: null });
    const emptyState = (fixture.nativeElement as HTMLElement).querySelector('[data-empty-state]');
    expect(emptyState).not.toBeNull();
    const heroCta = (fixture.nativeElement as HTMLElement).querySelector('button[fg-button]');
    expect(heroCta).toBeNull();
  });

  // ── Extra: loading disables CTA ────────────────────────────────────────────
  it('disables CTA when loading() is true', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    // Manually set loading state on the component instance
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'fg-card[data-hero] button[fg-button]',
    );
    // fg-button applies disabled via host binding; check the attribute or disabled property
    expect(btn).not.toBeNull();
    if (!btn) return;
    expect(btn.disabled).toBe(true);
  });

  // ── No auto-redirect ───────────────────────────────────────────────────────
  it('does NOT auto-navigate to /training/session when there is an active session', async () => {
    const activeSessionObj = { id: 's-1', dayId: 'd-1', status: 'in-progress' };
    await setup({ activeSession: activeSessionObj });

    // There must be NO call to navigate('/training/session') during init
    expect(navigateSpy).not.toHaveBeenCalledWith(['/training/session']);
  });

  // ── Card "Entrenamiento en curso" ──────────────────────────────────────────
  it('shows fg-card[data-in-progress] when there is an active session', async () => {
    const activeSessionObj = { id: 's-1', dayId: 'd-1', status: 'in-progress' };
    await setup({ activeSession: activeSessionObj });

    // activeSessionDay should be set (trainingDayRepoMock.getById returns mockDay)
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector('fg-card[data-in-progress]');
    expect(card).not.toBeNull();
  });

  it('shows "Entrenamiento en curso" label in the in-progress card', async () => {
    await setup({ activeSession: null });
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/entrenamiento en curso/i);
  });

  it('shows day name in the in-progress card', async () => {
    await setup({ activeSession: null });
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector('[data-in-progress]');
    expect(card?.textContent).toContain('Piernas');
  });

  it('"Continuar" button in in-progress card navigates to /training/session', async () => {
    await setup({ activeSession: null });
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    fixture.componentInstance.resumeSession();

    expect(navigateSpy).toHaveBeenCalledWith(['/training/session']);
  });

  it('shows confirmation when "Cancelar" is clicked in in-progress card', async () => {
    await setup({ activeSession: null });
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    fixture.componentInstance.confirmingCancelFromHome.set(true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('¿Seguro?');
  });

  it('cancelSessionFromHome() calls cancelUseCase, store.clear(), and clears activeSessionDay', async () => {
    const activeSessionObj = { id: 's-1', dayId: 'd-1', status: 'in-progress' };
    await setup({ activeSession: activeSessionObj });

    // Inject the session into the store mock so cancelSession has an ID to work with
    storeMock.activeSession.set(activeSessionObj as any);
    fixture.componentInstance.activeSessionDay.set(mockDay);
    fixture.detectChanges();

    await fixture.componentInstance.cancelSessionFromHome();

    expect(cancelUCMock.execute).toHaveBeenCalledWith({ sessionId: 's-1' });
    expect(storeMock.clear).toHaveBeenCalled();
    expect(fixture.componentInstance.activeSessionDay()).toBeNull();
  });

  // ── T5 — lenguaje Cuaderno ─────────────────────────────────────────────────

  describe('lenguaje Cuaderno (T5)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    function freezeDate(iso: string): void {
      // Solo Date: los timers y microtasks reales siguen corriendo.
      jest.useFakeTimers({
        now: new Date(iso),
        doNotFake: [
          'nextTick', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval',
          'setTimeout', 'clearTimeout', 'queueMicrotask', 'requestAnimationFrame',
          'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance',
          'hrtime',
        ],
      });
    }

    it('titles the page "Hoy" instead of "Entrenar"', async () => {
      await setup();
      const h1 = root().querySelector('h1');
      expect(h1?.textContent?.trim()).toBe('Hoy');
      expect(root().textContent).not.toContain('Entrenar');
    });

    it('shows the current date above the title in Spanish ("Martes 27 de octubre")', async () => {
      freezeDate('2026-10-27T10:00:00');
      await setup();
      expect(root().querySelector('[data-today-date]')?.textContent?.trim()).toBe('Martes 27 de octubre');
    });

    it('week strip shows the day number of every cell and marks today with aria-current', async () => {
      freezeDate('2026-10-27T10:00:00');
      await setup();
      const cells = Array.from(root().querySelectorAll<HTMLElement>('[data-week-cell]'));
      expect(cells.map((c) => c.querySelector('[data-week-num]')?.textContent?.trim())).toEqual([
        '26', '27', '28', '29', '30', '31', '1',
      ]);
      const current = root().querySelector('[data-week-cell] [aria-current="date"]');
      expect(current?.closest('[data-week-cell]')?.getAttribute('data-week-cell')).toBe('tuesday');
    });

    it('week strip marks a day with a completed session as done', async () => {
      freezeDate('2026-10-27T10:00:00');
      await setup({ sessions: [completedSession('s-mon', '2026-10-26', 'd-1')] });
      const monday = root().querySelector('[data-week-cell="monday"]');
      expect(monday?.getAttribute('data-week-state')).toBe('done');
      const tuesday = root().querySelector('[data-week-cell="tuesday"]');
      expect(tuesday?.getAttribute('data-week-state')).toBe('today');
    });

    it('shows "Hoy toca", the day name and the routine name in the hero card', async () => {
      await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
      const hero = root().querySelector('[data-hero]')!;
      expect(hero.textContent).toContain('Hoy toca');
      expect(hero.querySelector('h2')?.textContent).toContain('Piernas');
      expect(root().querySelector('[data-routine-card]')?.textContent).toContain('Fuerza total');
    });

    it('lists the exercises of the day with target and last time', async () => {
      await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
      const rows = Array.from(root().querySelectorAll<HTMLElement>('[data-plan-row]'));
      expect(rows).toHaveLength(2);
      expect(rows[0].textContent).toContain('Sentadilla');
      expect(rows[0].textContent).toContain('4 × 6–8');
      expect(rows[0].textContent).toContain('100 kg × 7');
      expect(rows[1].textContent).toContain('Peso muerto');
      expect(rows[1].textContent).toContain('3 × 5');
      expect(rows[1].textContent).toContain('—');
    });

    it('summarises the day in the hero footer ("7 series")', async () => {
      await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
      expect(root().querySelector('[data-hero]')?.textContent).toContain('7 series');
    });

    it('"Otros días" lists the other days of the routine, without today\'s day', async () => {
      await setup({ days: [mockDay, otherDay], suggestedDay: { day: mockDay, reason: 'scheduled' } });
      const list = root().querySelector('[data-days-list]')!;
      expect(list.textContent).toContain('Otros días');
      const buttons = Array.from(list.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'));
      expect(buttons).toEqual(['Empezar sesión de Torso']);
    });

    it('lists every day under "Días de la rutina" when there is no day for today', async () => {
      await setup({ days: [mockDay, otherDay], suggestedDay: { day: null, reason: 'rest-day' } });
      const list = root().querySelector('[data-days-list]')!;
      expect(list.textContent).toContain('Días de la rutina');
      const buttons = Array.from(list.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'));
      expect(buttons).toEqual(['Empezar sesión de Piernas', 'Empezar sesión de Torso']);
    });

    it('starts the session of another day from "Otros días"', async () => {
      await setup({ days: [mockDay, otherDay], suggestedDay: { day: mockDay, reason: 'scheduled' } });
      const btn = root().querySelector<HTMLButtonElement>('[data-days-list] button[aria-label="Empezar sesión de Torso"]')!;
      btn.click();
      await fixture.whenStable();
      await flushMicrotasks();
      expect(startUCMock.execute).toHaveBeenCalledWith({ routineId: 'r-1', dayId: 'd-2' });
      expect(navigateSpy).toHaveBeenCalledWith(['/training/session']);
    });

    it('"Diario" lists the latest completed sessions with stats and a PR tag', async () => {
      await setup({
        sessions: [
          completedSession('s-old', '2026-10-20', 'd-1', 57),
          completedSession('s-new', '2026-10-26', 'd-2', 52),
        ],
        setsBySession: {
          's-new': [weightSet('a', 's-new', 100, 10, true), weightSet('b', 's-new', 100, 10, true), weightSet('c', 's-new', 50, 10)],
          's-old': [weightSet('d', 's-old', 100, 5)],
        },
      });
      const rows = Array.from(root().querySelectorAll<HTMLElement>('[data-journal-row]'));
      expect(rows).toHaveLength(2);
      // Más reciente primero
      expect(rows[0].textContent).toContain('Torso');
      // A2: el volumen pasa por DisplayWeightPipe: punto decimal y sin separador de miles.
      expect(rows[0].textContent).toContain('52 min · 2500 kg · 3 series');
      expect(rows[0].textContent).toContain('PR ×2');
      expect(rows[1].textContent).toContain('Piernas');
      expect(rows[1].textContent).toContain('57 min · 500 kg · 1 serie');
      expect(rows[1].textContent).not.toContain('PR');
    });

    it('"Diario" ignores sessions that are not completed', async () => {
      const inProgress: Session = { ...completedSession('s-x', '2026-10-26', 'd-1'), status: 'in-progress', endedAt: undefined };
      await setup({ sessions: [inProgress] });
      expect(root().querySelectorAll('[data-journal-row]')).toHaveLength(0);
    });

    it('"Ver todo" links to /progress', async () => {
      await setup();
      const link = Array.from(root().querySelectorAll('a')).find((a) => a.textContent?.trim() === 'Ver todo');
      expect(link).toBeDefined();
      expect(link!.getAttribute('href')).toBe('/progress');
    });

    it('does not render the empty state nor "Diario" when there is no active routine', async () => {
      await setup({ routine: null, days: [], suggestedDay: null });
      expect(root().querySelector('[data-empty-state]')).not.toBeNull();
      expect(root().querySelector('[data-journal]')).toBeNull();
    });

    it('uses only semantic tokens: no forge-*, accent-<n>, destructive-* nor raw hex', async () => {
      await setup({ days: [mockDay, otherDay] });
      fixture.componentInstance.activeSessionDay.set(mockDay);
      fixture.detectChanges();
      const html = root().innerHTML;
      expect(html).not.toMatch(/\bforge-\d/);
      expect(html).not.toMatch(/\baccent-\d/);
      expect(html).not.toMatch(/destructive-\d|text-destructive/);
      expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    });

    // ── T18 · D4 / S11: ejercicios en placas ──────────────────────────────────

    describe('placas (D4 · S11)', () => {
      const platesPress = { id: 'ex-1', name: 'Sentadilla', weightUnit: 'plates' as const, plateWeightKg: 10 };
      const plateExercises = [platesPress, { id: 'ex-2', name: 'Peso muerto' }];
      const journalRow = (index: number): string =>
        Array.from(root().querySelectorAll('[data-journal-row]'))[index]?.textContent ?? '';

      it('"Última vez" reads "N placas × reps" and is never converted to lb', async () => {
        await setup({
          exercises: plateExercises,
          lastSets: { 'ex-1': lastSet('ex-1', 7, 8), 'ex-2': lastSet('ex-2', 140, 5) },
        });
        unitSignal.set('lb');
        fixture.detectChanges();
        const rows = Array.from(root().querySelectorAll<HTMLElement>('[data-plan-row]'));
        expect(rows[0].textContent).toContain('7 placas × 8');
        expect(rows[0].textContent).not.toMatch(/\bkg\b|\blb\b/);
        // The kg exercise next to it keeps following the preferred unit.
        expect(rows[1].textContent).toContain('308.6 lb × 5');
      });

      it('"Última vez" of a single plate reads "1 placa × reps"', async () => {
        await setup({ exercises: plateExercises, lastSets: { 'ex-1': lastSet('ex-1', 1, 12) } });
        expect(root().querySelector('[data-plan-row]')?.textContent).toContain('1 placa × 12');
      });

      it('"Diario" counts plates × plate weight × reps in kg', async () => {
        // 2 × (7 placas × 10 kg × 10 reps) = 1400 kg; the kg set of ex-2 adds 50 × 10 = 500 kg.
        await setup({
          exercises: plateExercises,
          sessions: [completedSession('s-new', '2026-10-26', 'd-2', 52)],
          setsBySession: {
            's-new': [
              weightSet('a', 's-new', 7, 10),
              weightSet('b', 's-new', 7, 10),
              { ...weightSet('c', 's-new', 50, 10), exerciseId: 'ex-2' },
            ],
          },
        });
        expect(journalRow(0)).toContain('52 min · 1900 kg · 3 series');
      });

      it('"Diario" converts the plates volume to the preferred unit and counts it on a rest day', async () => {
        await setup({
          suggestedDay: { day: null, reason: 'rest-day' },
          exercises: plateExercises,
          sessions: [completedSession('s-new', '2026-10-26', 'd-1', 52)],
          setsBySession: { 's-new': [weightSet('a', 's-new', 7, 10), weightSet('b', 's-new', 7, 10)] },
        });
        expect(journalRow(0)).toContain('52 min · 1400 kg · 2 series');

        unitSignal.set('lb');
        fixture.detectChanges();
        // 1400 kg = 3086.5 lb
        expect(journalRow(0)).toContain('52 min · 3086.5 lb · 2 series');
      });
    });

    // ── T17 · unidad A: correcciones de la auditoría de T16 ─────────────────────

    describe('correcciones de la auditoría (T17 · A1–A4)', () => {
      it('A1: the week strip marks "done" by the local date of startedAt, not by Session.date (UTC)', async () => {
        freezeDate('2026-10-27T10:00:00');
        // Lunes 26 a las 22:30 locales: en UTC−3 la sesión se guarda con date del martes.
        const mondayNight: Session = {
          ...completedSession('s-night', '2026-10-27', 'd-1'),
          startedAt: new Date(2026, 9, 26, 22, 30),
          endedAt: new Date(2026, 9, 26, 23, 40),
        };
        await setup({ sessions: [mondayNight] });
        expect(root().querySelector('[data-week-cell="monday"]')?.getAttribute('data-week-state')).toBe('done');
        // El martes todavía no se entrenó: sigue siendo "hoy".
        expect(root().querySelector('[data-week-cell="tuesday"]')?.getAttribute('data-week-state')).toBe('today');
      });

      it('A2: "Diario" volume uses the preferred unit with the display-weight format, also on a rest day', async () => {
        await setup({
          suggestedDay: { day: null, reason: 'rest-day' },
          sessions: [
            completedSession('s-new', '2026-10-26', 'd-1', 52),
            completedSession('s-old', '2026-10-20', 'd-2', 40),
          ],
          setsBySession: {
            's-new': [weightSet('a', 's-new', 100, 10), weightSet('b', 's-new', 100, 10)],
            // 32.2 × 3 = 96.60000000000001 en coma flotante: el ruido no llega al texto.
            's-old': [weightSet('c', 's-old', 32.2, 3)],
          },
        });
        // El día de descanso no arma el plan, pero igual pide la unidad preferida.
        expect(loadOnceMock).toHaveBeenCalled();
        const rows = (): string[] =>
          Array.from(root().querySelectorAll('[data-journal-row]')).map((r) => r.textContent ?? '');
        expect(rows()[0]).toContain('52 min · 2000 kg · 2 series');
        expect(rows()[1]).toContain('40 min · 96.6 kg · 1 serie');

        // La unidad llega cuando el Diario ya estaba armado: el volumen la sigue.
        unitSignal.set('lb');
        fixture.detectChanges();
        expect(rows()[0]).toContain('52 min · 4409.2 lb · 2 series');
        expect(rows()[1]).toContain('40 min · 213.0 lb · 1 serie');
        expect(rows().join(' ')).not.toContain('kg');
      });

      it('A3: "Hoy toca" shows "Nombre · Etiqueta" when the day has a label', async () => {
        await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
        expect(root().querySelector('[data-hero] h2')?.textContent?.trim()).toBe('Piernas · A');
      });

      it('A3: "Hoy toca" shows only the name when the day has no label', async () => {
        const unlabeled: TrainingDay = { ...mockDay, label: undefined };
        await setup({ days: [unlabeled], suggestedDay: { day: unlabeled, reason: 'scheduled' } });
        expect(root().querySelector('[data-hero] h2')?.textContent?.trim()).toBe('Piernas');
      });

      it('A4: shows the description of the active routine in a secondary line', async () => {
        await setup();
        expect(root().querySelector('[data-hero] [data-routine-description]')?.textContent?.trim()).toBe('Rutina de fuerza');
      });

      it('A4: shows no description line when the routine has none', async () => {
        const { description: _description, ...withoutDescription } = mockRoutine;
        await setup({ routine: withoutDescription });
        expect(root().querySelector('[data-routine-description]')).toBeNull();
      });
    });
  });
});
