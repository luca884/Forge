/**
 * PRListPage spec (D-7, D-2 redesign).
 * TDD strict — RED before implementation.
 * Verifies unit-aware formatting via UserPreferencesService mock.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { PRListPage } from './pr-list.page';
// GetAllPersonalRecordsUseCase is in component providers — not mocked at TestBed level
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { ToastService } from '@core/shared/ui';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';
import { Router } from '@angular/router';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';

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

describe('PRListPage', () => {
  let fixture: ComponentFixture<PRListPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [PRListPage],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        // GetAllPersonalRecordsUseCase is in component providers[] so component creates its own instance.
        // We must provide PersonalRecordRepository with correct data — the component-level use case will call listAll().
        { provide: PersonalRecordRepository, useValue: { save: jest.fn(), getById: jest.fn(), getCurrentForExercise: jest.fn(), listAll: jest.fn().mockResolvedValue([mockPR]) } },
        { provide: ExerciseRepository, useValue: { getAll: jest.fn().mockResolvedValue([mockExercise]) } },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();
  });

  it('calls loadOnce() during ngOnInit', async () => {
    fixture = TestBed.createComponent(PRListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  // P3-3: toast.error shown when init() fails
  it('calls toast.error when init() rejects (P3-3)', async () => {
    const prRepo = TestBed.inject(PersonalRecordRepository) as unknown as { listAll: jest.Mock };
    prRepo.listAll.mockRejectedValue(new Error('db error'));

    const toastService = TestBed.inject(ToastService);
    const errorSpy = jest.spyOn(toastService, 'error');

    fixture = TestBed.createComponent(PRListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('No se pudieron cargar los records', 'Intentá de nuevo');
  });

  it('renders a weight-reps PR with unit="lb" showing lb value', async () => {
    fixture = TestBed.createComponent(PRListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('renders a weight-reps PR with unit="kg" showing kg value', async () => {
    unitSignal.set('kg');
    fixture = TestBed.createComponent(PRListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });

  // D4 / S11: a plates exercise shows plates, never kg nor lb.
  describe('plates exercise', () => {
    async function settleWithPlates(plates: number): Promise<string> {
      const platesExercise = { ...mockExercise, id: 'ex-plates', name: 'Prensa', weightUnit: 'plates' as const, plateWeightKg: 10 };
      const set = { ...prSet, id: 'ws-plates', exerciseId: 'ex-plates', weight: { value: plates } as any } as WorkedSet;
      const record: PersonalRecord = {
        id: 'pr-plates', exerciseId: 'ex-plates', set, achievedAt: new Date('2026-01-01'),
        trackingType: 'weight-reps', workedSetId: set.id,
      };
      (TestBed.inject(ExerciseRepository) as unknown as { getAll: jest.Mock }).getAll.mockResolvedValue([mockExercise, platesExercise]);
      (TestBed.inject(PersonalRecordRepository) as unknown as { listAll: jest.Mock }).listAll.mockResolvedValue([record]);

      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).textContent ?? '';
    }

    it('shows the record as plates, not converted to lb', async () => {
      // unit is "lb" here (beforeEach)
      const text = await settleWithPlates(7);
      expect(text).toContain('7 placas × 5 reps');
      expect(text).not.toContain('lb');
    });

    it('reads one plate in the singular', async () => {
      const text = await settleWithPlates(1);
      expect(text).toContain('1 placa × 5 reps');
    });
  });

  describe('redesign D-2', () => {
    let routerNavigateSpy: jest.Mock;
    let listAllMock: jest.Mock;

    function makePR(overrides: Partial<PersonalRecord>): PersonalRecord {
      const set: WorkedSet = {
        id: 'ws-default',
        sessionId: 's-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        reps: { value: 5 } as any,
        weight: { value: 100 } as any,
        isPR: true,
        createdAt: new Date('2026-01-01'),
      } as WorkedSet;
      return {
        id: 'pr-default',
        exerciseId: 'ex-1',
        set,
        achievedAt: new Date('2026-01-01'),
        trackingType: 'weight-reps',
        workedSetId: 'ws-default',
        ...overrides,
      };
    }

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      routerNavigateSpy = TestBed.inject(Router).navigate as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      listAllMock = TestBed.inject(PersonalRecordRepository).listAll as jest.Mock;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    async function settle(): Promise<void> {
      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      fixture.detectChanges();
    }

    it('renders an h1 "Records personales" in its own Cuaderno header', async () => {
      await settle();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Records personales');
      expect(el.querySelector('fg-page-header')).toBeNull();
    });

    it('the back button is labelled "Volver", shows "Progreso" and navigates to /progress', async () => {
      await settle();
      const back = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Volver"]');
      expect(back?.textContent).toContain('Progreso');
      back!.click();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/progress']);
    });

    it('filters are real buttons in a group, with Todos pressed by default', async () => {
      await settle();
      const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"][aria-label="Filtro"]');
      const buttons = Array.from(group?.querySelectorAll('button') ?? []);
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Todos', 'Recientes']);
      expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    });

    it('tapping Recientes sets activeFilter to recent-30d and moves aria-pressed', async () => {
      await settle();
      const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"][aria-label="Filtro"]')!;
      const recientes = Array.from(group.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Recientes')!;
      recientes.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.activeFilter()).toBe('recent-30d');
      expect(recientes.getAttribute('aria-pressed')).toBe('true');
    });

    it('filteredPRs filters to last 30 days when activeFilter is recent-30d', async () => {
      // Set system time before creating component so computed runs with correct Date.now()
      jest.setSystemTime(new Date('2026-01-15'));
      jest.useFakeTimers({ now: new Date('2026-01-15') });

      listAllMock.mockResolvedValue([
        makePR({ id: 'pr-recent', achievedAt: new Date('2026-01-10') }),  // within 30d
        makePR({ id: 'pr-old', achievedAt: new Date('2025-11-01') }),     // older than 30d
      ]);

      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      // Use Promise.resolve chain instead of whenStable() to avoid fake timer deadlock
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();

      fixture.componentInstance.setFilter('recent-30d');
      fixture.detectChanges();

      expect(fixture.componentInstance.filteredPRs().length).toBe(1);
    });

    it('renders empty state with 30d copy when Recientes filter yields no PRs', async () => {
      jest.setSystemTime(new Date('2026-01-15'));
      jest.useFakeTimers({ now: new Date('2026-01-15') });

      listAllMock.mockResolvedValue([
        makePR({ id: 'pr-old', achievedAt: new Date('2025-11-01') }),
      ]);

      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();

      fixture.componentInstance.setFilter('recent-30d');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Sin PRs en los últimos 30 días');
    });

    it('clicking PR card button navigates to exercise page', async () => {
      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();
      // Find all buttons and click the one that navigates to exercise (not the page-header back button)
      const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('button[type="button"]');
      // The PR card button is rendered inside fg-card, after the page-header buttons
      const prCardBtn = Array.from(buttons).find(
        (b) => b.className.includes('w-full') || b.closest('fg-card') !== null,
      );
      expect(prCardBtn).toBeTruthy();
      prCardBtn!.click();
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/progress/exercise', 'ex-1']);
    });
  });
});
