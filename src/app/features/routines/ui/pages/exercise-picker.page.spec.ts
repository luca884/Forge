import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ExercisePickerPage } from './exercise-picker.page';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { AddExercisesToDayUseCase } from '../../domain/use-cases/add-exercises-to-day.use-case';
import { Exercise } from '@features/exercises/domain/exercise.entity';

// ---- Factories ----

const makeExercise = (id: string, name: string): Exercise => ({
  id,
  name,
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  weightUnit: 'kg',
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
  getExercisesSpy?: jest.Mock;
  seedSpy?: jest.Mock;
  queryParamMapGet?: jest.Mock;
} = {}): {
  fixture: ComponentFixture<ExercisePickerPage>;
  navigateSpy: jest.Mock;
  getExercisesSpy: jest.Mock;
  seedSpy: jest.Mock;
  addSpy: jest.Mock;
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const defaultExercises: Exercise[] = [
    makeExercise('ex-1', 'Press de banca'),
    makeExercise('ex-2', 'Sentadilla'),
  ];
  const getExercisesSpy = opts.getExercisesSpy ?? jest.fn().mockResolvedValue(
    opts.exercises !== undefined ? opts.exercises : defaultExercises,
  );
  const seedSpy = opts.seedSpy ?? jest.fn().mockResolvedValue(undefined);
  const addSpy = jest.fn().mockResolvedValue(undefined);

  const paramMap = {
    get: (k: string) =>
      k === 'routineId'
        ? (opts.routineId ?? 'r-1')
        : (opts.dayId ?? 'd-1'),
  };

  const queryParamMap = {
    get: opts.queryParamMapGet ?? jest.fn().mockReturnValue(null),
  };

  void TestBed.configureTestingModule({
    imports: [ExercisePickerPage, ReactiveFormsModule],
    providers: [
      { provide: Router, useValue: { navigate: navigateSpy } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap, queryParamMap } } },
    ],
  })
    .overrideComponent(ExercisePickerPage, {
      set: {
        providers: [
          { provide: GetExercisesUseCase, useValue: { execute: getExercisesSpy } },
          { provide: SeedExercisesUseCase, useValue: { execute: seedSpy } },
          { provide: AddExercisesToDayUseCase, useValue: { execute: addSpy } },
        ],
      },
    })
    .compileComponents();

  return { fixture: TestBed.createComponent(ExercisePickerPage), navigateSpy, getExercisesSpy, seedSpy, addSpy };
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

  describe('seeds catalog on open (F-1 fix)', () => {
    it('runs the seed and reloads so the picker is not empty on a fresh DB', async () => {
      // First load sees an empty DB; after the seed runs, the reload must
      // surface the freshly seeded catalog inside the routine-building flow.
      const getExercisesSpy = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([makeExercise('seed-1', 'Press de banca')]);
      const seedSpy = jest.fn().mockResolvedValue(undefined);

      const { fixture } = makeFixture({ getExercisesSpy, seedSpy });
      await flush(fixture);

      expect(seedSpy).toHaveBeenCalled();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Press de banca');
    });
  });

  describe('muscle-group filter (N-2)', () => {
    it('passes the selected muscle group to GetExercisesUseCase when a chip is toggled', async () => {
      const getExercisesSpy = jest.fn().mockResolvedValue([]);
      const { fixture } = makeFixture({ getExercisesSpy });
      await flush(fixture);
      getExercisesSpy.mockClear();

      fixture.componentInstance.toggleMuscleGroup('chest');
      await flush(fixture);

      expect(getExercisesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ muscleGroup: 'chest' }),
      );
    });

    it('renders muscle-group filter chips', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const chips = fixture.debugElement.queryAll(By.css('fg-chip'));
      // "Todos" + 9 muscle groups
      expect(chips.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('multi-select (#4)', () => {
    it('clickear una card la selecciona y NO navega', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const card = fixture.debugElement.query(By.css('button[aria-pressed]'));
      expect(card).toBeTruthy();
      (card.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isSelected('ex-1')).toBe(true);
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('seleccionar varios y "Agregar" llama AddExercisesToDayUseCase con los ids y navega', async () => {
      const { fixture, addSpy, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const cards = fixture.debugElement.queryAll(By.css('button[aria-pressed]'));
      expect(cards.length).toBe(2);
      (cards[0].nativeElement as HTMLButtonElement).click();
      (cards[1].nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedCount()).toBe(2);

      const addBtn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((b) => /Agregar 2/.test((b.nativeElement as HTMLButtonElement).textContent ?? ''));
      expect(addBtn).toBeTruthy();
      (addBtn!.nativeElement as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(addSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseIds: ['ex-1', 'ex-2'] });
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });
  });

  describe('create exercise button', () => {
    it('renders a "Crear ejercicio nuevo" button above the exercise list', async () => {
      const { fixture } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Crear ejercicio nuevo');
    });

    it('navigates to /exercises/new with returnRoutineId and returnDayId query params when clicked', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const btn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((b) => /Crear ejercicio nuevo/.test((b.nativeElement as HTMLButtonElement).textContent ?? ''));
      expect(btn).toBeTruthy();
      (btn!.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(
        ['/exercises/new'],
        { queryParams: { returnRoutineId: 'r-1', returnDayId: 'd-1' } },
      );
    });
  });

  describe('pre-select on return from create (selectedExerciseId query param)', () => {
    it('pre-selects the exercise if selectedExerciseId query param is set and reloads catalog', async () => {
      const getExercisesSpy = jest.fn().mockResolvedValue([
        makeExercise('ex-1', 'Press de banca'),
      ]);
      const queryParamMapGet = jest.fn().mockImplementation((key: string) =>
        key === 'selectedExerciseId' ? 'ex-1' : null,
      );

      const { fixture } = makeFixture({ getExercisesSpy, queryParamMapGet });
      await flush(fixture);

      expect(fixture.componentInstance.isSelected('ex-1')).toBe(true);
      // Called multiple times: effect() + initial load + selectedExerciseId reload
      expect(getExercisesSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
