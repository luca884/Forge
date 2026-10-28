/**
 * ExerciseHistoryPage spec (D-8, D-1 redesign).
 * TDD strict — RED before implementation.
 * Verifies unit-aware rendering via UserPreferencesService mock.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExerciseHistoryPage } from './exercise-history.page';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { ToastService } from '@core/shared/ui';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { WorkedSet } from '@features/training/domain/worked-set';
import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { SessionRepository } from '@features/training/domain/session.repository';

// Mock canvas for Chart.js in jsdom
type CanvasPrototypeExt = typeof HTMLCanvasElement.prototype & { __mockSet?: boolean };
beforeAll(() => {
  const proto = HTMLCanvasElement.prototype as CanvasPrototypeExt;
  if (!proto.__mockSet) {
    Object.defineProperty(proto, 'getContext', {
      value: jest.fn(() => ({
        clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(),
        arc: jest.fn(), fill: jest.fn(), stroke: jest.fn(),
        save: jest.fn(), restore: jest.fn(), scale: jest.fn(),
        translate: jest.fn(), rotate: jest.fn(),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        measureText: jest.fn(() => ({ width: 0 })), fillText: jest.fn(),
        strokeText: jest.fn(), setTransform: jest.fn(), drawImage: jest.fn(),
        canvas: { width: 300, height: 150 },
      })),
      configurable: true,
      writable: true,
    });
    proto.__mockSet = true;
  }
});

const prSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

const mockPR: PersonalRecord = {
  id: 'pr-1',
  exerciseId: 'ex-1',
  set: prSet,
  achievedAt: new Date('2026-01-01'),
  trackingType: 'weight-reps',
  workedSetId: 'ws-1',
};

const mockExercise = { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs' as const, trackingType: 'weight-reps' as const, weightUnit: 'kg' as const, isCustom: false, createdAt: new Date('2026-01-01') };

describe('ExerciseHistoryPage', () => {
  let fixture: ComponentFixture<ExerciseHistoryPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ExerciseHistoryPage],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        { provide: ExerciseRepository, useValue: { getById: jest.fn().mockResolvedValue(mockExercise) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('ex-1') } } } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        // GetCurrentPRForExerciseUseCase and GetExerciseHistoryUseCase are in component providers[]
        {
          provide: PersonalRecordRepository,
          useValue: {
            save: jest.fn(), getById: jest.fn(),
            getCurrentForExercise: jest.fn().mockResolvedValue(mockPR),
            listAll: jest.fn().mockResolvedValue([mockPR]),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            save: jest.fn(), getActive: jest.fn(), getById: jest.fn(),
            getSetsForSession: jest.fn().mockResolvedValue([prSet]),
            addSetToSession: jest.fn(), editWorkedSet: jest.fn(), removeWorkedSet: jest.fn(),
            getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([prSet]),
            getLastWorkedSetForExercise: jest.fn().mockResolvedValue(null),
            getAllSessions: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('calls loadOnce() during ngOnInit', async () => {
    fixture = TestBed.createComponent(ExerciseHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  // P3-3: toast.error shown when init() fails
  it('calls toast.error when init() rejects (P3-3)', async () => {
    const exRepo = TestBed.inject(ExerciseRepository) as unknown as { getById: jest.Mock };
    exRepo.getById.mockRejectedValue(new Error('db error'));

    const toastService = TestBed.inject(ToastService);
    const errorSpy = jest.spyOn(toastService, 'error');

    fixture = TestBed.createComponent(ExerciseHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('No se pudo cargar el historial', 'Intentá de nuevo');
  });

  it('renders 1RM stat with unit="lb" using DisplayWeightPipe', async () => {
    fixture = TestBed.createComponent(ExerciseHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // 100kg at 5 reps → 1RM via Epley formula, displayed in lb
    expect(text).toMatch(/lb/);
  });

  it('renders recent history sets with unit="lb"', async () => {
    fixture = TestBed.createComponent(ExerciseHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // Flush chained promise microtasks from init()
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('passes unit to fg-exercise-history-chart via [unit] binding', async () => {
    fixture = TestBed.createComponent(ExerciseHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.unit()).toBe('lb');
  });

  describe('redesign D-1', () => {
    let routerNavigateSpy: jest.Mock;
    let getAllWorkedSetsMock: jest.Mock;

    function makeSet(overrides: Partial<WorkedSet>): WorkedSet {
      return {
        id: 'ws-default',
        sessionId: 's-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        reps: { value: 5 } as any,
        weight: { value: 100 } as any,
        isPR: false,
        createdAt: new Date('2026-01-01'),
        ...overrides,
      } as WorkedSet;
    }

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      routerNavigateSpy = TestBed.inject(Router).navigate as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getAllWorkedSetsMock = TestBed.inject(SessionRepository).getAllWorkedSetsForExercise as jest.Mock;
    });

    async function settle(): Promise<void> {
      fixture = TestBed.createComponent(ExerciseHistoryPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
    }

    const root = (): HTMLElement => fixture.nativeElement as HTMLElement;

    it('titles the page with the exercise name and a muscle group · unit line (C-Exercise)', async () => {
      await settle();
      expect(root().querySelector('h1')?.textContent?.trim()).toBe('Sentadilla');
      expect(root().querySelector('fg-page-header')).toBeNull();
      const meta = root().querySelector('[data-exercise-meta]')?.textContent ?? '';
      expect(meta).toContain('Piernas');
      expect(meta).toContain('lb');
    });

    it('the back button is labelled "Volver", shows "Progreso" and navigates to /progress', async () => {
      await settle();
      const back = root().querySelector<HTMLButtonElement>('button[aria-label="Volver"]');
      expect(back?.textContent).toContain('Progreso');
      back!.click();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/progress']);
    });

    it('shows the summary tiles: 1RM est., Mejor serie, Reps máx. and Sesiones', async () => {
      await settle();
      const tiles = root().querySelector('[aria-label="Resumen del ejercicio"]')!;
      const text = tiles.textContent ?? '';
      expect(text).toContain('1RM est.');
      expect(text).toContain('Mejor serie');
      expect(text).toContain('Reps máx.');
      expect(text).toContain('Sesiones');
      // Best set in the preferred unit, max reps, sessions counted
      expect(text).toContain('220.5 lb × 5');
      expect(tiles.querySelector('[data-stat="max-reps"]')?.textContent?.trim()).toBe('5');
      expect(tiles.querySelector('[data-stat="sessions"]')?.textContent?.trim()).toBe('1');
    });

    // C2: "Mejor serie" and "Reps máx." are computed from the registered sets, never from the PR table.
    describe('best set from the registered sets', () => {
      const tile = (stat: string): string =>
        root().querySelector(`[aria-label="Resumen del ejercicio"] [data-stat="${stat}"]`)?.textContent?.trim() ?? '';

      const kg = (value: number): any => ({ value });

      beforeEach(() => {
        unitSignal.set('kg');
        // The PR table holds 100 kg x 5 (mockPR), which the registered sets below do not contain.
        getAllWorkedSetsMock.mockResolvedValue([
          makeSet({ id: 'ws-a', sessionId: 's-1', weight: kg(80), reps: { value: 8 } as any, createdAt: new Date('2026-01-01') }),
          makeSet({ id: 'ws-b', sessionId: 's-2', weight: kg(80), reps: { value: 10 } as any, createdAt: new Date('2026-01-08') }),
          makeSet({ id: 'ws-c', sessionId: 's-3', weight: kg(70), reps: { value: 12 } as any, createdAt: new Date('2026-01-15') }),
        ]);
      });

      it('shows the heaviest registered set, and on a tie the one with more reps', async () => {
        await settle();
        expect(tile('best')).toBe('80 kg × 10');
      });

      it('shows the best set in the preferred unit', async () => {
        unitSignal.set('lb');
        await settle();
        expect(tile('best')).toBe('176.4 lb × 10');
      });

      it('brings back the most reps of any set as "Reps máx."', async () => {
        await settle();
        expect(tile('max-reps')).toBe('12');
        expect(root().querySelector('[aria-label="Resumen del ejercicio"]')?.textContent).toContain('Reps máx.');
      });

      it('shows all three even when there is no PR row at all', async () => {
        const prRepo = TestBed.inject(PersonalRecordRepository) as unknown as { getCurrentForExercise: jest.Mock };
        prRepo.getCurrentForExercise.mockResolvedValue(null);
        await settle();
        expect(tile('best')).toBe('80 kg × 10');
        expect(tile('max-reps')).toBe('12');
        expect(tile('1rm')).toBe('106.7 kg');
      });

      // T17 · C2: with a stale or tied PR row, "1RM est." must not contradict "Mejor serie".
      it('estimates the 1RM from the same best set, not from the PR row', async () => {
        await settle();
        // 80 kg x 10 -> Epley 106.67 kg; the PR row (100 kg x 5) would give 116.7 kg.
        expect(tile('1rm')).toBe('106.7 kg');
      });
    });

    it('rounds the 1RM tile to one decimal in kg so it fits the tile', async () => {
      unitSignal.set('kg');
      await settle();
      // 100 kg x 5 -> Epley 116.666... kg: must not print a long decimal tail
      const text = root().querySelector('[data-stat="1rm"]')?.textContent?.trim() ?? '';
      expect(text).toMatch(/^\d+(\.\d)? kg$/);
    });

    it('shows "—" in the tiles when there is no weight-reps history', async () => {
      const pr = TestBed.inject(PersonalRecordRepository) as unknown as { getCurrentForExercise: jest.Mock };
      pr.getCurrentForExercise.mockResolvedValue(null);
      getAllWorkedSetsMock.mockResolvedValue([]);
      await settle();
      const tiles = root().querySelector('[aria-label="Resumen del ejercicio"]')!;
      expect(tiles.querySelector('[data-stat="best"]')?.textContent?.trim()).toBe('—');
      expect(tiles.querySelector('[data-stat="max-reps"]')?.textContent?.trim()).toBe('—');
      expect(tiles.querySelector('[data-stat="1rm"]')?.textContent?.trim()).toBe('—');
    });

    it('lists the sessions under an "Historial" heading with the unit in the column header', async () => {
      await settle();
      const heading = Array.from(root().querySelectorAll('h2')).find((h) => h.textContent?.trim() === 'Historial');
      expect(heading).toBeTruthy();
      expect(root().textContent).toContain('Series (lb × reps)');
      expect(root().textContent).toContain('Vol.');
    });

    // T17 · C5: "(lb × reps)" only describes weight-reps sets; the others carry their own unit.
    it.each(['time', 'distance-time', 'bodyweight-reps'] as const)(
      'drops the "(unit × reps)" hint from the column header for %s exercises',
      async (trackingType) => {
        const exRepo = TestBed.inject(ExerciseRepository) as unknown as { getById: jest.Mock };
        exRepo.getById.mockResolvedValue({ ...mockExercise, trackingType });
        await settle();
        const header = Array.from(root().querySelectorAll('span')).find((s) => s.textContent?.trim().startsWith('Series'));
        expect(header?.textContent?.trim()).toBe('Series');
      },
    );

    it('shows each session volume in the preferred unit', async () => {
      await settle();
      // 100 kg × 5 reps = 500 kg → 1102 lb
      expect(root().querySelector('[data-session-volume]')?.textContent?.trim()).toBe('1102');
    });

    it('groupedHistory groups sets by sessionId', async () => {
      getAllWorkedSetsMock.mockResolvedValue([
        makeSet({ id: 'ws-a', sessionId: 's-1', createdAt: new Date('2026-01-01') }),
        makeSet({ id: 'ws-b', sessionId: 's-1', createdAt: new Date('2026-01-01') }),
        makeSet({ id: 'ws-c', sessionId: 's-2', createdAt: new Date('2026-01-02') }),
      ]);
      fixture = TestBed.createComponent(ExerciseHistoryPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      expect(fixture.componentInstance.groupedHistory().length).toBe(2);
    });

    // ── C7: the list is cut at 10 sessions: say so, and let the user see them all ──
    describe('more than 10 sessions', () => {
      /** `count` sessions, one set each, on consecutive days starting 2026-01-01. */
      function sessions(count: number): WorkedSet[] {
        return Array.from({ length: count }, (_, i) =>
          makeSet({ id: `ws-${i}`, sessionId: `s-${i}`, createdAt: new Date(2026, 0, 1 + i) }),
        );
      }

      const rowCount = (): number => root().querySelectorAll('[data-session-volume]').length;
      const notice = (): string | undefined => root().querySelector('[data-history-notice]')?.textContent?.trim();
      const seeAll = (): HTMLButtonElement | undefined =>
        Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Ver todas');

      it('shows the latest 10 sessions with an "Últimas 10 de N" notice and a "Ver todas" button', async () => {
        getAllWorkedSetsMock.mockResolvedValue(sessions(12));
        await settle();

        expect(rowCount()).toBe(10);
        expect(notice()).toBe('Últimas 10 de 12');
        expect(seeAll()).toBeTruthy();
      });

      it('keeps the heading as "Historial" only: the notice and the button are separate elements', async () => {
        getAllWorkedSetsMock.mockResolvedValue(sessions(12));
        await settle();

        const heading = Array.from(root().querySelectorAll('h2')).find((h) => h.textContent?.includes('Historial'));
        expect(heading?.textContent?.trim()).toBe('Historial');
      });

      it('"Ver todas" lists every session and drops the notice and the button', async () => {
        getAllWorkedSetsMock.mockResolvedValue(sessions(12));
        await settle();

        seeAll()!.click();
        fixture.detectChanges();

        expect(rowCount()).toBe(12);
        expect(notice()).toBeUndefined();
        expect(seeAll()).toBeUndefined();
      });

      it('shows neither the notice nor the button with 10 sessions or fewer', async () => {
        getAllWorkedSetsMock.mockResolvedValue(sessions(10));
        await settle();

        expect(rowCount()).toBe(10);
        expect(notice()).toBeUndefined();
        expect(seeAll()).toBeUndefined();
      });
    });

    it('renders fg-chip with "PR" text when session hasPR', async () => {
      getAllWorkedSetsMock.mockResolvedValue([
        makeSet({ id: 'ws-pr', sessionId: 's-pr', isPR: true, createdAt: new Date('2026-01-03') }),
      ]);
      fixture = TestBed.createComponent(ExerciseHistoryPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      const chips = fixture.debugElement.queryAll(By.css('fg-chip'));
      const prChip = chips.find(
        (c) => (c.nativeElement as HTMLElement).textContent?.trim() === 'PR',
      );
      expect(prChip).toBeTruthy();
    });

    it('does not render a PR fg-chip when no set in session is a PR', async () => {
      getAllWorkedSetsMock.mockResolvedValue([
        makeSet({ id: 'ws-no-pr', sessionId: 's-1', isPR: false, createdAt: new Date('2026-01-01') }),
      ]);
      fixture = TestBed.createComponent(ExerciseHistoryPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      const chips = fixture.debugElement.queryAll(By.css('fg-chip'));
      const prChip = chips.find(
        (c) => (c.nativeElement as HTMLElement).textContent?.trim() === 'PR',
      );
      expect(prChip).toBeUndefined();
    });

    it('renders fg-empty-state when history is empty', async () => {
      getAllWorkedSetsMock.mockResolvedValue([]);
      fixture = TestBed.createComponent(ExerciseHistoryPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      expect(emptyState).toBeTruthy();
    });
  });
});
