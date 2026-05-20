import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { TrainingDayEditorPage } from './training-day-editor.page';
import {
  GetTrainingDayWithExercisesUseCase,
  type TrainingDayView,
} from '../../domain/use-cases/get-training-day-with-exercises.use-case';
import { EditTrainingDayUseCase } from '../../domain/use-cases/edit-training-day.use-case';
import { RemoveExerciseFromDayUseCase } from '../../domain/use-cases/remove-exercise-from-day.use-case';

// ---- Factories ----

const makeView = (overrides: Partial<TrainingDayView> = {}): TrainingDayView => ({
  id: 'd-1',
  routineId: 'r-1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ---- flush helper (slice F pattern) ----

async function flush(fixture: ComponentFixture<TrainingDayEditorPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

// ---- Setup ----

function makeFixture(opts: {
  routineId?: string;
  dayId?: string;
  view?: TrainingDayView | null;
} = {}): {
  fixture: ComponentFixture<TrainingDayEditorPage>;
  navigateSpy: jest.Mock;
  getDayViewSpy: jest.Mock;
  editSpy: jest.Mock;
  removeSpy: jest.Mock;
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const getDayViewSpy = jest.fn().mockResolvedValue(
    opts.view !== undefined ? opts.view : makeView(),
  );
  const editSpy = jest.fn().mockResolvedValue(undefined);
  const removeSpy = jest.fn().mockResolvedValue(undefined);

  const paramMap = {
    get: (k: string) =>
      k === 'routineId'
        ? (opts.routineId ?? 'r-1')
        : (opts.dayId ?? 'd-1'),
  };

  void TestBed.configureTestingModule({
    imports: [TrainingDayEditorPage, ReactiveFormsModule],
    providers: [
      { provide: Router, useValue: { navigate: navigateSpy } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap } },
      },
    ],
  })
    .overrideComponent(TrainingDayEditorPage, {
      set: {
        providers: [
          {
            provide: GetTrainingDayWithExercisesUseCase,
            useValue: { execute: getDayViewSpy },
          },
          { provide: EditTrainingDayUseCase, useValue: { execute: editSpy } },
          {
            provide: RemoveExerciseFromDayUseCase,
            useValue: { execute: removeSpy },
          },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(TrainingDayEditorPage);
  return { fixture, navigateSpy, getDayViewSpy, editSpy, removeSpy };
}

// ---- Tests ----

describe('TrainingDayEditorPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('loading state', () => {
    it('loading() starts true, fg-skeleton visible, form hidden before load resolves', async () => {
      const { fixture } = makeFixture();
      // Only one detectChanges — before async load resolves
      fixture.detectChanges();
      expect(fixture.componentInstance.loading()).toBe(true);
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeTruthy();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeNull();
    });

    it('after load resolves: loading() is false, form visible, no skeleton', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      expect(fixture.componentInstance.loading()).toBe(false);
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeNull();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });
  });

  describe('page header', () => {
    it('renders fg-page-header with title "Editar día" and leading chevron-left', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const header = fixture.debugElement.query(By.css('fg-page-header'));
      expect(header).toBeTruthy();
      expect(header.attributes['title']).toBe('Editar día');
      expect(header.attributes['leadingIcon']).toBe('chevron-left');
    });

    it('leading chevron-left navigates to /routines/:routineId', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1' });
      await flush(fixture);

      const header = fixture.debugElement.query(By.css('fg-page-header'));
      header.triggerEventHandler('leadingClick', null);

      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
    });
  });

  describe('exercise rendering', () => {
    it('renders exerciseName (not UUID) for each exercise row', async () => {
      const view = makeView({
        exercises: [
          {
            exerciseId: '7c4a-uuid-long',
            exerciseName: 'Bench Press',
            order: 0,
            targetSets: [],
          },
        ],
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Bench Press');
      expect(text).not.toMatch(/Ejercicio [0-9a-f-]{8,}/);
    });

    it('renders "[Ejercicio eliminado]" for deleted exercise — no UUID visible', async () => {
      const view = makeView({
        exercises: [
          {
            exerciseId: 'ex-deleted',
            exerciseName: '[Ejercicio eliminado]',
            order: 0,
            targetSets: [],
          },
        ],
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('[Ejercicio eliminado]');
      expect(text).not.toMatch(/Ejercicio [0-9a-f-]{8,}/);
    });

    it('renders fg-empty-state and no fg-card when exercises array is empty', async () => {
      const view = makeView({ exercises: [] });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      const cards = fixture.debugElement.queryAll(By.css('fg-card'));
      expect(emptyState).toBeTruthy();
      expect(cards).toHaveLength(0);
    });

    it('renders fg-card per exercise and no fg-empty-state when exercises exist', async () => {
      const view = makeView({
        exercises: [
          { exerciseId: 'ex-1', exerciseName: 'Squat', order: 0, targetSets: [] },
        ],
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const cards = fixture.debugElement.queryAll(By.css('fg-card'));
      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      expect(cards).toHaveLength(1);
      expect(emptyState).toBeNull();
    });
  });

  describe('navigation', () => {
    it('"Agregar ejercicio" button navigates to /routines/r-1/days/d-1/pick-exercise', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const buttons = fixture.debugElement.queryAll(By.css('button[fg-button]'));
      const addBtn = buttons.find(b =>
        ((b.nativeElement as HTMLElement).textContent ?? '').includes('Agregar ejercicio'),
      );
      expect(addBtn).toBeTruthy();
      (addBtn!.nativeElement as HTMLButtonElement).click();

      expect(navigateSpy).toHaveBeenCalledWith([
        '/routines',
        'r-1',
        'days',
        'd-1',
        'pick-exercise',
      ]);
    });

    it('trailing check action navigates to /routines/:routineId on valid save', async () => {
      const view = makeView({ name: 'Día A' });
      const { fixture, navigateSpy, editSpy } = makeFixture({ routineId: 'r-1', view });
      await flush(fixture);

      fixture.componentInstance.form.patchValue({ name: 'Día A v2' });
      fixture.componentInstance.trailingActions[0]!.click();
      await fixture.whenStable();

      expect(editSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Día A v2' }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
    });
  });

  describe('save flow', () => {
    it('invalid form: editSpy NOT called, submitAttempted becomes true', async () => {
      const view = makeView({ name: '' });
      const { fixture, editSpy } = makeFixture({ view });
      await flush(fixture);

      fixture.componentInstance.form.patchValue({ name: '' });
      fixture.componentInstance.trailingActions[0]!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(editSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.submitAttempted()).toBe(true);
    });

    it('invalid form: fg-input shows error message', async () => {
      const view = makeView({ name: 'Día A' });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      fixture.componentInstance.form.patchValue({ name: '' });
      fixture.componentInstance.trailingActions[0]!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      const fgInput = fixture.debugElement.query(By.css('fg-input'));
      const errorAttr = fgInput?.attributes['ng-reflect-error'] ?? fgInput?.properties['error'];
      expect(errorAttr).toBeTruthy();
    });

    it('remove exercise calls RemoveExerciseFromDayUseCase and reloads', async () => {
      const ex = {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        order: 0,
        targetSets: [],
      };
      const view = makeView({ exercises: [ex] });
      const { fixture, removeSpy, getDayViewSpy } = makeFixture({ view, dayId: 'd-1' });
      await flush(fixture);

      const removeBtn = fixture.debugElement.query(
        By.css('button[aria-label^="Quitar"]'),
      );
      expect(removeBtn).toBeTruthy();
      (removeBtn.nativeElement as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(removeSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseId: 'ex-1' });
      expect(getDayViewSpy).toHaveBeenCalledTimes(2); // initial + reload
    });
  });
});
