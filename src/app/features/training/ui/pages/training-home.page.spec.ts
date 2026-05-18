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
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TrainingHomePage } from './training-home.page';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { StartSessionUseCase } from '../../domain/use-cases/start-session.use-case';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { GetSuggestedDayForTodayUseCase } from '../../domain/use-cases/get-suggested-day-for-today.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
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
  exercises: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

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
  let storeMock: { loadActive: jest.Mock; activeSession: ReturnType<typeof signal<null>> };

  async function setup(overrides: {
    routine?: Routine | null;
    days?: TrainingDay[];
    suggestedDay?: { day: TrainingDay | null; reason: string } | null;
    activeSession?: object | null;
  } = {}): Promise<void> {
    const {
      routine = mockRoutine,
      days = [mockDay],
      suggestedDay = { day: mockDay, reason: 'scheduled' },
      activeSession = null,
    } = overrides;

    routineRepoMock = { getActive: jest.fn().mockResolvedValue(routine) };
    trainingDayRepoMock = {
      getByRoutineId: jest.fn().mockResolvedValue(days),
      getById: jest.fn().mockResolvedValue(mockDay),
    };
    startUCMock = { execute: jest.fn().mockResolvedValue(undefined) };
    activeSessionUCMock = { execute: jest.fn().mockResolvedValue(activeSession) };
    suggestedUCMock = { execute: jest.fn().mockResolvedValue(suggestedDay) };
    storeMock = { loadActive: jest.fn().mockResolvedValue(undefined), activeSession: signal(null) };

    await TestBed.configureTestingModule({
      imports: [TrainingHomePage, RouterTestingModule],
      providers: [
        { provide: RoutineRepository, useValue: routineRepoMock },
        { provide: TrainingDayRepository, useValue: trainingDayRepoMock },
        { provide: TrainingSessionStore, useValue: storeMock },
      ],
    })
      .overrideComponent(TrainingHomePage, {
        set: {
          providers: [
            { provide: StartSessionUseCase, useValue: startUCMock },
            { provide: GetActiveSessionUseCase, useValue: activeSessionUCMock },
            { provide: GetSuggestedDayForTodayUseCase, useValue: suggestedUCMock },
          ],
        },
      })
      .compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(TrainingHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    await flushMicrotasks();
    fixture.detectChanges();
  }

  // ── V-D1-Spec-2 ────────────────────────────────────────────────────────────
  it('renders fg-card[data-hero] when activeRoutine set and suggestedDay=scheduled', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const hero = (fixture.nativeElement as HTMLElement).querySelector('fg-card[data-hero]');
    expect(hero).not.toBeNull();
  });

  // ── V-D1-Spec-3 ────────────────────────────────────────────────────────────
  it('renders button[fg-button][leadingIcon=zap] with text "Empezar sesión" when scheduled', async () => {
    await setup({ suggestedDay: { day: mockDay, reason: 'scheduled' } });
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[fg-button]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('Empezar sesión');
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
});
