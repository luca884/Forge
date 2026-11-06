/**
 * SessionDetailPage — a finished session, its sets per exercise, and their correction.
 * Spec: odd/tasks/sesiones-pasadas.md S1, S2, S4.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import type { Reps } from '@core/shared/domain/value-objects/reps';
import type { Weight } from '@core/shared/domain/value-objects/weight';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { SessionRepository } from '../../domain/session.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { CorrectPastSetUseCase } from '../../domain/use-cases/correct-past-set.use-case';
import type { WeightRepsSet, WorkedSet } from '../../domain/worked-set';
import type { Exercise } from '../../../exercises/domain/exercise.entity';
import { ExerciseSessionCardComponent } from '../components/exercise-session-card.component';
import { SessionDetailPage } from './session-detail.page';

const at = (minute: number) => new Date(2026, 10, 3, 18, minute);
const lift = (id: string, exerciseId: string, minute: number, weight: number): WeightRepsSet => ({
  id, sessionId: 's1', exerciseId, type: 'weight-reps', isPR: false, createdAt: at(minute), reps: { value: 5 } as Reps, weight: { value: weight } as Weight,
});
const exercise = (id: string, name: string): Exercise =>
  ({ id, name, muscleGroup: 'legs', trackingType: 'weight-reps', weightUnit: 'kg', isCustom: false, createdAt: at(0), updatedAt: at(0) }) as Exercise;

describe('SessionDetailPage', () => {
  let fixture: ComponentFixture<SessionDetailPage>;
  let sets: WorkedSet[];
  let status: string;
  const correct = { edit: jest.fn(), remove: jest.fn() };
  const toast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };

  async function render(sessionId = 's1'): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SessionDetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ sessionId }) } } },
        {
          provide: SessionRepository,
          useValue: {
            getById: (id: string) =>
              Promise.resolve(id === 's1' ? { id: 's1', dayId: 'day-1', status, startedAt: at(0), endedAt: at(50) } : null),
            getSetsForSession: () => Promise.resolve([...sets]),
          },
        },
        { provide: TrainingDayRepository, useValue: { getById: () => Promise.resolve({ id: 'day-1', name: 'Pierna A' }) } },
        {
          provide: ExerciseRepository,
          useValue: { getById: (id: string) => Promise.resolve(id === 'ex-sq' ? exercise('ex-sq', 'Sentadilla') : exercise('ex-dl', 'Peso muerto')) },
        },
        { provide: CorrectPastSetUseCase, useValue: correct },
        { provide: ToastService, useValue: toast },
        { provide: UserPreferencesService, useValue: { unit: signal('kg'), loadOnce: () => Promise.resolve() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SessionDetailPage);
    await settle();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const cards = () => fixture.debugElement.queryAll(By.directive(ExerciseSessionCardComponent));

  beforeEach(() => {
    sets = [lift('a', 'ex-sq', 5, 100), lift('b', 'ex-dl', 20, 140), lift('c', 'ex-sq', 10, 105)];
    status = 'completed';
    correct.edit.mockReset().mockResolvedValue(undefined);
    correct.remove.mockReset().mockResolvedValue(undefined);
    Object.values(toast).forEach((fn) => fn.mockReset());
  });

  afterEach(() => TestBed.resetTestingModule());

  it('names the day and the date, and lists the sets of each exercise in the order they were done (S1)', async () => {
    await render();

    expect(text()).toContain('Pierna A');
    expect(text()).toContain('martes, 3 de noviembre de 2026');
    const shown = cards().map((c) => {
      const card = c.componentInstance as ExerciseSessionCardComponent;
      return [card.exercise.name, card.loggedSets.map((s) => s.id), card.canLog()];
    });
    expect(shown).toEqual([
      ['Sentadilla', ['a', 'c'], false],
      ['Peso muerto', ['b'], false],
    ]);
  });

  it('an edited set is corrected through the use case and the sets reload (S2)', async () => {
    await render();
    sets = [lift('a', 'ex-sq', 5, 90), lift('b', 'ex-dl', 20, 140), lift('c', 'ex-sq', 10, 105)];

    (cards()[0].componentInstance as ExerciseSessionCardComponent).setEdited.emit(lift('a', 'ex-sq', 5, 90));
    await settle();

    expect(correct.edit).toHaveBeenCalledWith('s1', lift('a', 'ex-sq', 5, 90));
    expect(toast.success).toHaveBeenCalledWith('Serie corregida');
    expect((cards()[0].componentInstance as ExerciseSessionCardComponent).loggedSets[0]).toEqual(lift('a', 'ex-sq', 5, 90));
  });

  it('a removed set is removed through the use case; an exercise left with no sets disappears (S2)', async () => {
    await render();
    sets = [lift('a', 'ex-sq', 5, 100), lift('c', 'ex-sq', 10, 105)];

    (cards()[1].componentInstance as ExerciseSessionCardComponent).setRemoved.emit('b');
    await settle();

    expect(correct.remove).toHaveBeenCalledWith('s1', 'b');
    expect(toast.success).toHaveBeenCalledWith('Serie borrada');
    expect(cards().map((c) => (c.componentInstance as ExerciseSessionCardComponent).exercise.name)).toEqual(['Sentadilla']);
  });

  it('when the correction fails, says so and keeps the sets as they were', async () => {
    correct.edit.mockRejectedValue(new Error('fallo DB'));
    await render();

    (cards()[0].componentInstance as ExerciseSessionCardComponent).setEdited.emit(lift('a', 'ex-sq', 5, 90));
    await settle();

    expect(toast.error).toHaveBeenCalledWith('No se pudo guardar la corrección', 'fallo DB');
    expect((cards()[0].componentInstance as ExerciseSessionCardComponent).loggedSets[0]).toEqual(lift('a', 'ex-sq', 5, 100));
  });

  it('an unknown session says so', async () => {
    await render('nope');
    expect(text()).toContain('No encontramos esta sesión.');
    expect(cards()).toEqual([]);
  });

  it('the session in progress is corrected inside the session: it sends you there (S4)', async () => {
    status = 'in-progress';
    const navigate = jest.spyOn(Router.prototype, 'navigate').mockResolvedValue(true);
    await render();

    expect(navigate).toHaveBeenCalledWith(['/training/session'], { replaceUrl: true });
    expect(cards()).toEqual([]);
    navigate.mockRestore();
  });
});
