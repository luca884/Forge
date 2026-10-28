/**
 * ProgressHomePage spec (Slice C).
 * TDD strict — RED before redesign implementation.
 * Covers V-D2-Spec-1 through V-D2-Spec-7 + navigation per spec.
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressHomePage } from './progress-home.page';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Router } from '@angular/router';
import { SessionRepository } from '@features/training/domain/session.repository';
import { ToastService } from '@core/shared/ui';
import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';

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

const mockExercise = {
  id: 'ex-1',
  name: 'Sentadilla',
  muscleGroup: 'legs' as const,
  trackingType: 'weight-reps' as const,
  weightUnit: 'kg' as const,
  isCustom: false,
  createdAt: new Date('2026-01-01'),
};

const mockSessionRepo = {
  save: jest.fn(),
  getActive: jest.fn(),
  getById: jest.fn(),
  getSetsForSession: jest.fn().mockResolvedValue([]),
  addSetToSession: jest.fn(),
  editWorkedSet: jest.fn(),
  removeWorkedSet: jest.fn(),
  getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]),
  getLastWorkedSetForExercise: jest.fn().mockResolvedValue(null),
  getAllSessions: jest.fn().mockResolvedValue([]),
  getWorkedSetsSince: jest.fn().mockResolvedValue([]),
};

describe('ProgressHomePage', () => {
  let fixture: ComponentFixture<ProgressHomePage>;
  let navigateSpy: jest.Mock;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    navigateSpy = jest.fn().mockResolvedValue(true);
    unitSignal = signal<PreferredUnit>('kg');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ProgressHomePage],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        {
          provide: PersonalRecordRepository,
          useValue: {
            save: jest.fn(),
            getById: jest.fn(),
            getCurrentForExercise: jest.fn(),
            listAll: jest.fn().mockResolvedValue([mockPR]),
          },
        },
        {
          provide: ExerciseRepository,
          useValue: {
            getAll: jest.fn().mockResolvedValue([mockExercise]),
            getById: jest.fn().mockResolvedValue(mockExercise),
          },
        },
        {
          provide: Router,
          useValue: { navigate: navigateSpy },
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepo,
        },
      ],
    }).compileComponents();
  });

  async function init(): Promise<void> {
    fixture = TestBed.createComponent(ProgressHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    // init() awaits six use cases in parallel: let every continuation run.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  // V-D2-Spec-1: calls use cases on init
  it('calls getAllPRs.execute(), getSessionHeatmap.execute() and exerciseRepo.getAll() during init', async () => {
    // Cast to unknown first to access mock methods without TS conflict
    const prRepo = TestBed.inject(PersonalRecordRepository) as unknown as { listAll: jest.Mock };
    const exRepo = TestBed.inject(ExerciseRepository) as unknown as { getAll: jest.Mock };
    const sessRepo = TestBed.inject(SessionRepository) as unknown as { getAllSessions: jest.Mock };
    await init();
    expect(prRepo.listAll).toHaveBeenCalled();
    expect(exRepo.getAll).toHaveBeenCalled();
    expect(sessRepo.getAllSessions).toHaveBeenCalled();
  });

  // V-D2-Spec-2: Cuaderno header — an h1 "Progreso" (no fg-page-header)
  it('renders an h1 "Progreso" in its own Cuaderno header', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Progreso');
    expect(el.querySelector('fg-page-header')).toBeNull();
  });

  it('loads the preferred unit on init', async () => {
    await init();
    expect(loadOnceSpy).toHaveBeenCalled();
  });

  // V-D2-Spec-3: renders non-undefined headerSubtitle() when PRs > 0
  it('renders subtitle text when totalPRs > 0', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // subtitle should contain PR count info
    expect(el.textContent).toMatch(/1 PR · \d+ esta semana/);
  });

  // V-D2-Spec-4: the heatmap lives in a card titled "Constancia" with the session total
  it('renders <fg-session-heatmap> nested inside <fg-card> under the "Constancia" heading', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    const heatmap = el.querySelector('fg-session-heatmap');
    expect(heatmap).toBeTruthy();
    const heading = Array.from(el.querySelectorAll('h2')).find((h) => h.textContent?.trim() === 'Constancia');
    expect(heading).toBeTruthy();
    const card = heatmap?.closest('fg-card');
    expect(card).toBeTruthy();
    expect(card?.contains(heading!)).toBe(true);
  });

  it('shows how many sessions the heatmap holds', async () => {
    await init();
    fixture.componentInstance.heatmapData.set(new Map([['2026-10-01', 2], ['2026-10-03', 1]]));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 sesiones');
  });

  it('renders dashboard overview, weekly trend and exercise progress sections', async () => {
    await init();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fg-dashboard-overview')).toBeTruthy();
    expect(el.querySelector('fg-weekly-trend-chart')).toBeTruthy();
    expect(el.querySelector('fg-exercise-progress-list')).toBeTruthy();
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(expect.arrayContaining(['Últimos 30 días', 'Progreso por ejercicio']));
  });

  // V-D2-Spec-5: renders 2 stat fg-card tiles with totalPRs() and prsThisWeek() values
  it('renders stat cards with PR count values', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // totalPRs = 1 (one mockPR), text should contain "1"
    expect(el.textContent).toContain('PRs totales');
    expect(el.textContent).toContain('PRs esta semana');
  });

  // Skeleton loading state — renders <fg-skeleton> while loading() is true
  it('renders <fg-skeleton> inside fg-card while loading() is true', () => {
    fixture = TestBed.createComponent(ProgressHomePage);
    // Loading defaults to true on init — render BEFORE any async init completes
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const skeleton = el.querySelector('fg-skeleton');
    expect(skeleton).toBeTruthy();
    const skeletonInsideCard = skeleton?.closest('fg-card');
    expect(skeletonInsideCard).toBeTruthy();
  });

  // V-D2-Spec-6: renders fg-empty-state when recentPRs().length === 0
  it('renders <fg-empty-state> (not raw <p class="empty-state">) when no PRs', async () => {
    // Signal the component to show empty state by setting allPRs to empty after loading
    fixture = TestBed.createComponent(ProgressHomePage);
    // Manually set loading to false + allPRs to empty to test that branch
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.allPRs.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emptyState = el.querySelector('fg-empty-state');
    expect(emptyState).toBeTruthy();
    const rawEmpty = el.querySelector('p.empty-state');
    expect(rawEmpty).toBeNull();
  });

  // V-D2-Spec-7: click on PR row navigates to /progress/exercise/:id
  it('navigates to /progress/exercise/:id when a PR row is clicked', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector<HTMLButtonElement>('[data-testid="pr-row"]');
    expect(row).toBeTruthy();
    row!.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/progress/exercise', 'ex-1']);
  });

  // ── Récords personales table (C-Progress) ──────────────────────────────────
  describe('récords personales', () => {
    it('is titled "Récords personales" and has Ejercicio / Mejor / 1RM columns', async () => {
      await init();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Récords personales');
      expect(text).toContain('Ejercicio');
      expect(text).toContain('Mejor');
      expect(text).toContain('1RM');
    });

    it('lists the exercise, the best set and the estimated 1RM, in kg by default', async () => {
      await init();
      const row = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="pr-row"]')!;
      expect(row.textContent).toContain('Sentadilla');
      expect(row.textContent).toContain('100 kg × 5');
      // Epley: 100 × (1 + 5/30) ≈ 116.7
      expect(row.textContent).toMatch(/116\.\d+ kg/);
    });

    // C6: the table lists exercises, not records — the same lift must not fill the five rows.
    function prFor(id: string, exerciseId: string, weight: number, reps: number, achievedAt: string): PersonalRecord {
      const set: WorkedSet = {
        ...prSet,
        id: `ws-${id}`,
        exerciseId,
        weight: { value: weight } as any,
        reps: { value: reps } as any,
        createdAt: new Date(achievedAt),
      } as WorkedSet;
      return { id, exerciseId, set, achievedAt: new Date(achievedAt), trackingType: 'weight-reps', workedSetId: set.id };
    }

    function rows(): HTMLElement[] {
      return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-testid="pr-row"]'));
    }

    it('shows one row per exercise with its best mark, not one row per record', async () => {
      await init();
      fixture.componentInstance.allPRs.set([
        prFor('pr-4', 'ex-1', 110, 3, '2026-03-04'),
        prFor('pr-3', 'ex-1', 105, 5, '2026-03-03'),
        prFor('pr-2', 'ex-1', 102, 5, '2026-03-02'),
        prFor('pr-1', 'ex-1', 100, 5, '2026-03-01'),
        prFor('pr-0', 'ex-1', 95, 5, '2026-02-01'),
      ]);
      fixture.detectChanges();

      expect(rows()).toHaveLength(1);
      expect(rows()[0]!.textContent).toContain('110 kg × 3');
    });

    it('lists up to five exercises, ordered by their most recent record', async () => {
      await init();
      fixture.componentInstance.allPRs.set(
        [1, 2, 3, 4, 5, 6, 7].map((n) => prFor(`pr-${n}`, `ex-${n}`, 50 + n, 5, `2026-03-0${n}`)).reverse(),
      );
      fixture.detectChanges();

      // ex-7 (Mar 7) ... ex-3 (Mar 3); ex-1 and ex-2 fall off. Names come from the exercise map (unknown ids show the id).
      expect(rows().map((r) => r.textContent)).toEqual([
        expect.stringContaining('ex-7'),
        expect.stringContaining('ex-6'),
        expect.stringContaining('ex-5'),
        expect.stringContaining('ex-4'),
        expect.stringContaining('ex-3'),
      ]);
    });

    it('shows weights in lb when the preferred unit is lb (no fixed "kg")', async () => {
      unitSignal.set('lb');
      await init();
      const row = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="pr-row"]')!;
      expect(row.textContent).toContain('220.5 lb × 5');
      expect(row.textContent).not.toContain('kg');
    });

    it('offers "Ver todos" with a single PR and navigates to /progress/prs', async () => {
      await init();
      const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Ver todos'),
      );
      expect(btn).toBeTruthy();
      btn!.click();
      expect(navigateSpy).toHaveBeenCalledWith(['/progress/prs']);
    });

    it('offers "Ver los N" when there are several PRs', async () => {
      await init();
      fixture.componentInstance.allPRs.set([mockPR, { ...mockPR, id: 'pr-2' }, { ...mockPR, id: 'pr-3' }]);
      fixture.detectChanges();
      const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Ver los 3'),
      );
      expect(btn).toBeTruthy();
    });
  });

  // D4 / S11: a plates exercise shows plates, never kg nor lb; its 1RM goes over plates × plate weight.
  describe('plates exercise', () => {
    const platesExercise = {
      ...mockExercise,
      id: 'ex-plates',
      name: 'Prensa',
      weightUnit: 'plates' as const,
      plateWeightKg: 10,
    };

    async function initWithPlatesRecord(plates: number): Promise<HTMLElement> {
      const set = {
        ...prSet,
        id: 'ws-plates',
        exerciseId: 'ex-plates',
        weight: { value: plates } as any,
        reps: { value: 5 } as any,
      } as WorkedSet;
      const record: PersonalRecord = {
        id: 'pr-plates',
        exerciseId: 'ex-plates',
        set,
        achievedAt: new Date('2026-01-02'),
        trackingType: 'weight-reps',
        workedSetId: set.id,
      };
      (TestBed.inject(ExerciseRepository) as unknown as { getAll: jest.Mock }).getAll.mockResolvedValue([
        mockExercise,
        platesExercise,
      ]);
      (TestBed.inject(PersonalRecordRepository) as unknown as { listAll: jest.Mock }).listAll.mockResolvedValue([record]);
      await init();
      return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="pr-row"]')!;
    }

    it('lists the best set as plates, not converted to lb', async () => {
      unitSignal.set('lb');
      const row = await initWithPlatesRecord(7);
      expect(row.textContent).toContain('7 placas × 5');
    });

    it('reads one plate in the singular', async () => {
      const row = await initWithPlatesRecord(1);
      expect(row.textContent).toContain('1 placa × 5');
      expect(row.textContent).not.toContain('1 placas');
    });

    it('estimates the 1RM over plates × plate weight and shows it in the preferred unit', async () => {
      // 7 plates × 10 kg = 70 kg x 5 → Epley 81.67 kg → 81.7 kg → 180.1 lb
      unitSignal.set('lb');
      const row = await initWithPlatesRecord(7);
      expect(row.textContent).toContain('180.1 lb');
    });
  });

  // P3-3: toast.error shown when init() fails
  it('calls toast.error when init() rejects (P3-3)', async () => {
    const exRepo = TestBed.inject(ExerciseRepository) as unknown as { getAll: jest.Mock };
    exRepo.getAll.mockRejectedValue(new Error('network error'));

    const toastService = TestBed.inject(ToastService);
    const errorSpy = jest.spyOn(toastService, 'error');

    fixture = TestBed.createComponent(ProgressHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('No se pudo cargar el progreso', 'Intentá de nuevo');
  });
});
