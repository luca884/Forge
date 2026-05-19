/**
 * PRListPage spec (D-7, D-2 redesign).
 * TDD strict — RED before implementation.
 * Verifies unit-aware formatting via UserPreferencesService mock.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PRListPage } from './pr-list.page';
// GetAllPersonalRecordsUseCase is in component providers — not mocked at TestBed level
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
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

const mockExercise = { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs' as const, trackingType: 'weight-reps' as const, isCustom: false, createdAt: new Date('2026-01-01') };

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

  it('renders a weight-reps PR with unit="lb" showing lb value', async () => {
    fixture = TestBed.createComponent(PRListPage);
    fixture.detectChanges();
    await fixture.whenStable();
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
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
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
      routerNavigateSpy = TestBed.inject(Router).navigate as jest.Mock;
      listAllMock = TestBed.inject(PersonalRecordRepository).listAll as jest.Mock;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('renders fg-page-header with "Records personales" title', async () => {
      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('fg-page-header'));
      expect(header).toBeTruthy();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Records personales');
    });

    it('tapping Recientes chip sets activeFilter to recent-30d', async () => {
      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      fixture.detectChanges();
      const chips = fixture.debugElement.queryAll(By.css('fg-chip'));
      const recientesChip = chips.find(
        (c) => c.nativeElement.textContent.trim() === 'Recientes',
      );
      expect(recientesChip).toBeTruthy();
      recientesChip!.triggerEventHandler('tap', undefined);
      expect(fixture.componentInstance.activeFilter()).toBe('recent-30d');
    });

    it('filteredPRs filters to last 30 days when activeFilter is recent-30d', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15'));

      listAllMock.mockResolvedValue([
        makePR({ id: 'pr-recent', achievedAt: new Date('2026-01-10') }),  // within 30d
        makePR({ id: 'pr-old', achievedAt: new Date('2025-11-01') }),     // older than 30d
      ]);

      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
      fixture.detectChanges();

      fixture.componentInstance.setFilter('recent-30d');
      fixture.detectChanges();

      expect(fixture.componentInstance.filteredPRs().length).toBe(1);
    });

    it('renders empty state with 30d copy when Recientes filter yields no PRs', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15'));

      listAllMock.mockResolvedValue([
        makePR({ id: 'pr-old', achievedAt: new Date('2025-11-01') }),
      ]);

      fixture = TestBed.createComponent(PRListPage);
      fixture.detectChanges();
      await fixture.whenStable();
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
      fixture.detectChanges();
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="button"]');
      expect(btn).toBeTruthy();
      (btn as HTMLElement).click();
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/progress/exercise', 'ex-1']);
    });
  });
});
