import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ExercisePickerPage } from './exercise-picker.page';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';
import { AddExerciseToDayUseCase } from '../../domain/use-cases/add-exercise-to-day.use-case';
import { Exercise } from '@features/exercises/domain/exercise.entity';

// ---- Factories ----

const makeExercise = (id: string, name: string): Exercise => ({
  id,
  name,
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ---- flush helper ----

async function flush(fixture: ComponentFixture<ExercisePickerPage>): Promise<void> {
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
  exercises?: Exercise[];
} = {}): {
  fixture: ComponentFixture<ExercisePickerPage>;
  navigateSpy: jest.Mock;
  getExercisesSpy: jest.Mock;
  addSpy: jest.Mock;
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const defaultExercises: Exercise[] = [
    makeExercise('ex-1', 'Press de banca'),
    makeExercise('ex-2', 'Sentadilla'),
  ];
  const getExercisesSpy = jest.fn().mockResolvedValue(
    opts.exercises !== undefined ? opts.exercises : defaultExercises,
  );
  const addSpy = jest.fn().mockResolvedValue(undefined);

  const paramMap = {
    get: (k: string) =>
      k === 'routineId'
        ? (opts.routineId ?? 'r-1')
        : (opts.dayId ?? 'd-1'),
  };

  void TestBed.configureTestingModule({
    imports: [ExercisePickerPage, ReactiveFormsModule],
    providers: [
      { provide: Router, useValue: { navigate: navigateSpy } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap } } },
    ],
  })
    .overrideComponent(ExercisePickerPage, {
      set: {
        providers: [
          { provide: GetExercisesUseCase, useValue: { execute: getExercisesSpy } },
          { provide: AddExerciseToDayUseCase, useValue: { execute: addSpy } },
        ],
      },
    })
    .compileComponents();

  return { fixture: TestBed.createComponent(ExercisePickerPage), navigateSpy, getExercisesSpy, addSpy };
}

// ---- Tests ----

describe('ExercisePickerPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('page header', () => {
    it('renders fg-page-header with title "Elegir ejercicio" and leading chevron-left', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const header = fixture.debugElement.query(By.css('fg-page-header'));
      expect(header).toBeTruthy();
      expect(header.attributes['title']).toBe('Elegir ejercicio');
      expect(header.attributes['leadingIcon']).toBe('chevron-left');
    });

    it('does NOT have trailing actions', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const header = fixture.debugElement.query(By.css('fg-page-header'));
      // The trailingActions binding should be absent / undefined
      const trailingAttr = header.properties['trailingActions'] as unknown;
      expect(trailingAttr === undefined || trailingAttr === null || (Array.isArray(trailingAttr) && (trailingAttr as unknown[]).length === 0)).toBe(true);
    });

    it('leading chevron-left navigates back to /routines/r-1/days/d-1', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const header = fixture.debugElement.query(By.css('fg-page-header'));
      header.triggerEventHandler('leadingClick', null);

      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });
  });

  describe('exercise list', () => {
    it('renders two fg-card elements with exercise names', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const cards = fixture.debugElement.queryAll(By.css('fg-card'));
      expect(cards).toHaveLength(2);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Press de banca');
      expect(text).toContain('Sentadilla');
    });

    it('renders fg-empty-state and no fg-card when exercises list is empty', async () => {
      const { fixture } = makeFixture({ exercises: [] });
      await flush(fixture);

      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      const cards = fixture.debugElement.queryAll(By.css('fg-card'));
      expect(emptyState).toBeTruthy();
      expect(cards).toHaveLength(0);
    });

    it('uses fg-input for search (not raw input)', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const fgInput = fixture.debugElement.query(By.css('fg-input'));
      expect(fgInput).toBeTruthy();
    });
  });

  describe('pick exercise', () => {
    it('clicking exercise card calls AddExerciseToDayUseCase and navigates back', async () => {
      const { fixture, addSpy, navigateSpy } = makeFixture({
        routineId: 'r-1',
        dayId: 'd-1',
      });
      await flush(fixture);

      const pickBtn = fixture.debugElement.query(
        By.css('button[aria-label^="Elegir"]'),
      );
      expect(pickBtn).toBeTruthy();
      (pickBtn.nativeElement as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(addSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseId: 'ex-1' });
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });
  });
});
