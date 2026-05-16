/**
 * SessionSummaryPage spec (D-4).
 * TDD strict — RED before implementation.
 * Verifies unit-aware weight rendering via UserPreferencesService mock.
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

const weightRepsSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

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

describe('SessionSummaryPage', () => {
  let fixture: ComponentFixture<SessionSummaryPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    const mockStore = {
      activeSession: signal(completedSession),
      workedSets: signal([]),
      setsByExercise: signal(new Map()),
    };

    const mockSessionRepo = {
      getById: jest.fn().mockResolvedValue(completedSession),
      getSetsForSession: jest.fn().mockResolvedValue([weightRepsSet]),
    };

    await TestBed.configureTestingModule({
      imports: [SessionSummaryPage],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        { provide: TrainingSessionStore, useValue: mockStore },
        { provide: SessionRepository, useValue: mockSessionRepo },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();
  });

  it('calls loadOnce() during ngOnInit', async () => {
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    // Allow microtasks to flush
    await Promise.resolve();
    expect(loadOnceSpy).toHaveBeenCalledTimes(1);
  });

  it('renders weight-reps set with unit="lb" showing lb value', async () => {
    fixture = TestBed.createComponent(SessionSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // Flush remaining microtasks from chained promises
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('renders weight-reps set with unit="kg" showing kg value (default)', async () => {
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
