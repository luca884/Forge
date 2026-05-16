/**
 * TrainingSessionPage spec (D-5) — smoke test.
 * TDD strict — RED before implementation.
 * Verifies page compiles and passes unit to child components.
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
import { TrainingSessionPage } from './training-session.page';
import { TrainingSessionStore } from '../services/training-session.store';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { LogSetUseCase } from '../../domain/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../domain/use-cases/complete-session.use-case';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import type { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { Router } from '@angular/router';
import { SessionRepository } from '../../domain/session.repository';
import { PersonalRecordDetector } from '../../domain/services/personal-record-detector';
import { EventBus } from '@core/shared/events/event-bus';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { RestTimerService } from '../services/rest-timer.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';

describe('TrainingSessionPage', () => {
  let fixture: ComponentFixture<TrainingSessionPage>;
  let unitSignal: ReturnType<typeof signal<PreferredUnit>>;
  let loadOnceSpy: jest.Mock;

  beforeEach(async () => {
    unitSignal = signal<PreferredUnit>('lb');
    loadOnceSpy = jest.fn().mockResolvedValue(undefined);

    const mockStore = {
      activeSession: signal(null),
      workedSets: signal([]),
      setsByExercise: signal(new Map()),
      loadActive: jest.fn().mockResolvedValue(undefined),
      refreshSets: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TrainingSessionPage],
      providers: [
        { provide: UserPreferencesService, useValue: { unit: unitSignal, loadOnce: loadOnceSpy } },
        { provide: TrainingSessionStore, useValue: mockStore },
        { provide: TrainingDayRepository, useValue: { getById: jest.fn().mockResolvedValue(null) } },
        { provide: ExerciseRepository, useValue: { getById: jest.fn().mockResolvedValue(null) } },
        { provide: LogSetUseCase, useValue: { execute: jest.fn() } },
        { provide: CompleteSessionUseCase, useValue: { execute: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        // LogSetUseCase and CompleteSessionUseCase are in component providers[] and inject these:
        { provide: SessionRepository, useValue: { save: jest.fn(), addSetToSession: jest.fn(), getActive: jest.fn(), getById: jest.fn(), getSetsForSession: jest.fn() } },
        { provide: PersonalRecordDetector, useValue: { detect: jest.fn().mockResolvedValue(null) } },
        { provide: EventBus, useValue: { publish: jest.fn(), subscribe: jest.fn(() => () => {}) } },
        { provide: PersonalRecordRepository, useValue: { save: jest.fn(), findCurrent: jest.fn(), findAll: jest.fn() } },
        { provide: RestTimerService, useValue: { remaining: signal(null), start: jest.fn(), skip: jest.fn(), cancel: jest.fn() } },
        { provide: NotificationPermissionService, useValue: { status: signal('default'), requestPermission: jest.fn() } },
      ],
    }).compileComponents();
  });

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
});
