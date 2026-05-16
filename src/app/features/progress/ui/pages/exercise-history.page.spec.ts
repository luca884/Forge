/**
 * ExerciseHistoryPage spec (D-8).
 * TDD strict — RED before implementation.
 * Verifies unit-aware rendering via UserPreferencesService mock.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExerciseHistoryPage } from './exercise-history.page';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
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

const mockExercise = { id: 'ex-1', name: 'Sentadilla', muscleGroup: 'legs' as const, trackingType: 'weight-reps' as const, isCustom: false, createdAt: new Date('2026-01-01') };

describe('ExerciseHistoryPage', () => {
  let fixture: ComponentFixture<ExerciseHistoryPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ExerciseHistoryPage],
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
});
