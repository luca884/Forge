/**
 * PRListPage spec (D-7).
 * TDD strict — RED before implementation.
 * Verifies unit-aware formatting via UserPreferencesService mock.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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
});
