import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ExercisePickerPage } from './exercise-picker.page';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { AddExercisesToDayUseCase } from '../../domain/use-cases/add-exercises-to-day.use-case';
import { GetTrainingDayWithExercisesUseCase } from '../../domain/use-cases/get-training-day-with-exercises.use-case';
import { RoutineRepository } from '../../domain/routine.repository';
import { Exercise } from '@features/exercises/domain/exercise.entity';

// ---- Factories ----

const makeExercise = (id: string, name: string, overrides: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeDayView = (name: string, exerciseIds: string[]): unknown => ({
  id: 'd-1',
  routineId: 'r-1',
  name,
  exercises: exerciseIds.map((exerciseId, order) => ({
    exerciseId,
    order,
    targetSets: [],
    exerciseName: exerciseId,
    trackingType: 'weight-reps',
  })),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ---- flush helper ----

async function flush(fixture: ComponentFixture<ExercisePickerPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  for (let i = 0; i < 8; i++) await Promise.resolve();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

// ---- Setup ----

interface Opts {
  routineId?: string;
  dayId?: string;
  exercises?: Exercise[];
  getExercisesSpy?: jest.Mock;
  seedSpy?: jest.Mock;
  queryParamMapGet?: jest.Mock;
  /** null = el día no existe. */
  day?: unknown;
  routineName?: string | null;
}

function makeFixture(opts: Opts = {}): {
  fixture: ComponentFixture<ExercisePickerPage>;
  navigateSpy: jest.Mock;
  getExercisesSpy: jest.Mock;
  seedSpy: jest.Mock;
  addSpy: jest.Mock;
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const defaultExercises: Exercise[] = [
    makeExercise('ex-1', 'Press de banca'),
    makeExercise('ex-2', 'Sentadilla', { muscleGroup: 'legs', equipment: 'barbell' }),
  ];
  const getExercisesSpy = opts.getExercisesSpy ?? jest.fn().mockResolvedValue(
    opts.exercises !== undefined ? opts.exercises : defaultExercises,
  );
  const seedSpy = opts.seedSpy ?? jest.fn().mockResolvedValue(undefined);
  const addSpy = jest.fn().mockResolvedValue(undefined);
  const dayView = opts.day !== undefined ? opts.day : makeDayView('Pierna B', []);
  const getDaySpy = jest.fn().mockResolvedValue(dayView);
  const routineRepo = {
    getById: jest.fn().mockResolvedValue(
      opts.routineName === null ? null : { id: 'r-1', name: opts.routineName ?? 'Torso / Pierna' },
    ),
  };

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
      { provide: RoutineRepository, useValue: routineRepo },
    ],
  })
    .overrideComponent(ExercisePickerPage, {
      set: {
        providers: [
          { provide: GetExercisesUseCase, useValue: { execute: getExercisesSpy } },
          { provide: SeedExercisesUseCase, useValue: { execute: seedSpy } },
          { provide: AddExercisesToDayUseCase, useValue: { execute: addSpy } },
          { provide: GetTrainingDayWithExercisesUseCase, useValue: { execute: getDaySpy } },
        ],
      },
    })
    .compileComponents();

  return { fixture: TestBed.createComponent(ExercisePickerPage), navigateSpy, getExercisesSpy, seedSpy, addSpy };
}

// ---- DOM helpers ----

const root = (f: ComponentFixture<ExercisePickerPage>): HTMLElement => f.nativeElement as HTMLElement;
const rows = (f: ComponentFixture<ExercisePickerPage>): HTMLButtonElement[] =>
  Array.from(root(f).querySelectorAll<HTMLButtonElement>('button[data-exercise-row]'));
const buttonByText = (f: ComponentFixture<ExercisePickerPage>, re: RegExp): HTMLButtonElement | undefined =>
  Array.from(root(f).querySelectorAll<HTMLButtonElement>('button')).find((b) => re.test(b.textContent ?? ''));
const buttonByLabel = (f: ComponentFixture<ExercisePickerPage>, label: string): HTMLButtonElement | null =>
  root(f).querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
const cta = (f: ComponentFixture<ExercisePickerPage>): HTMLButtonElement =>
  root(f).querySelector<HTMLButtonElement>('[data-picker-cta]')!;

// ---- Tests ----

describe('ExercisePickerPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('header', () => {
    it('muestra "Agregar a {día}" como h1 y la rutina como subtítulo', async () => {
      const { fixture } = makeFixture({ day: makeDayView('Pierna B', []), routineName: 'Torso / Pierna' });
      await flush(fixture);

      expect(root(fixture).querySelector('h1')?.textContent?.trim()).toBe('Agregar a Pierna B');
      expect(root(fixture).querySelector('[data-picker-routine]')?.textContent?.trim()).toBe('Torso / Pierna');
    });

    it('si el día no existe, el título cae a "Agregar ejercicios" y no hay subtítulo', async () => {
      const { fixture } = makeFixture({ day: null, routineName: null });
      await flush(fixture);

      expect(root(fixture).querySelector('h1')?.textContent?.trim()).toBe('Agregar ejercicios');
      expect(root(fixture).querySelector('[data-picker-routine]')).toBeNull();
    });

    it('"Cancelar" vuelve a /routines/r-1/days/d-1', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const cancel = buttonByText(fixture, /^\s*Cancelar\s*$/);
      expect(cancel).toBeTruthy();
      cancel!.click();

      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });
  });

  describe('exercise list', () => {
    it('renderiza una fila por ejercicio con su nombre y su meta', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      expect(rows(fixture)).toHaveLength(2);
      const text = root(fixture).textContent ?? '';
      expect(text).toContain('Press de banca');
      expect(text).toContain('Sentadilla');
      expect(text).toContain('Piernas · Barra');
      expect(text).toContain('Pecho');
    });

    it('con la lista vacía muestra fg-empty-state y ninguna fila', async () => {
      const { fixture } = makeFixture({ exercises: [] });
      await flush(fixture);

      expect(root(fixture).querySelector('fg-empty-state')).toBeTruthy();
      expect(rows(fixture)).toHaveLength(0);
    });

    it('el título de la sección cuenta los ejercicios: "Todos · 2"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      expect(root(fixture).querySelector('[data-group-title]')?.textContent?.trim()).toBe('Todos · 2');
    });

    it('el título de la sección sigue al grupo elegido', async () => {
      const getExercisesSpy = jest.fn().mockResolvedValue([makeExercise('ex-1', 'Press de banca')]);
      const { fixture } = makeFixture({ getExercisesSpy });
      await flush(fixture);

      fixture.componentInstance.toggleMuscleGroup('chest');
      await flush(fixture);

      expect(root(fixture).querySelector('[data-group-title]')?.textContent?.trim()).toBe('Pecho · 1');
    });

    it('marca los ejercicios propios con la etiqueta "Propio"', async () => {
      const { fixture } = makeFixture({
        exercises: [
          makeExercise('ex-1', 'Hack squat', { isCustom: true }),
          makeExercise('ex-2', 'Sentadilla'),
        ],
      });
      await flush(fixture);

      const [custom, builtIn] = rows(fixture);
      expect(custom?.textContent).toContain('Propio');
      expect(builtIn?.textContent).not.toContain('Propio');
    });
  });

  describe('search', () => {
    it('es un input type=search con nombre accesible "Buscar ejercicio"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const input = root(fixture).querySelector<HTMLInputElement>('input[type="search"]');
      expect(input).toBeTruthy();
      expect(input!.labels?.[0]?.textContent).toContain('Buscar ejercicio');
    });

    it('el placeholder cuenta toda la biblioteca: "Buscar en 2 ejercicios"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const input = root(fixture).querySelector<HTMLInputElement>('input[type="search"]');
      expect(input!.placeholder).toBe('Buscar en 2 ejercicios');
    });

    it('escribir filtra con GetExercisesUseCase', async () => {
      const getExercisesSpy = jest.fn().mockResolvedValue([]);
      const { fixture } = makeFixture({ getExercisesSpy });
      await flush(fixture);
      getExercisesSpy.mockClear();

      fixture.componentInstance.searchControl.setValue('sent');
      await flush(fixture);

      expect(getExercisesSpy).toHaveBeenCalledWith(expect.objectContaining({ search: 'sent' }));
    });
  });

  describe('seeds catalog on open (F-1 fix)', () => {
    it('runs the seed and reloads so the picker is not empty on a fresh DB', async () => {
      const getExercisesSpy = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([makeExercise('seed-1', 'Press de banca')]);
      const seedSpy = jest.fn().mockResolvedValue(undefined);

      const { fixture } = makeFixture({ getExercisesSpy, seedSpy });
      await flush(fixture);

      expect(seedSpy).toHaveBeenCalled();
      expect(root(fixture).textContent ?? '').toContain('Press de banca');
    });
  });

  describe('muscle-group filter (N-2)', () => {
    it('passes the selected muscle group to GetExercisesUseCase when toggled', async () => {
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

    it('los filtros son <button aria-pressed> enfocables con teclado: "Todos" + 9 grupos', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const group = root(fixture).querySelector('[role="group"][aria-label="Filtrar por grupo muscular"]');
      const filters = Array.from(group?.querySelectorAll<HTMLButtonElement>('button[aria-pressed]') ?? []);
      expect(filters).toHaveLength(10);
      expect(filters[0]?.getAttribute('aria-pressed')).toBe('true');
    });

    it('tocar un filtro lo activa y vuelve a pedir la lista con ese grupo', async () => {
      const getExercisesSpy = jest.fn().mockResolvedValue([]);
      const { fixture } = makeFixture({ getExercisesSpy });
      await flush(fixture);
      getExercisesSpy.mockClear();

      const pecho = buttonByText(fixture, /^\s*Pecho\s*$/);
      pecho!.click();
      await flush(fixture);

      expect(getExercisesSpy).toHaveBeenCalledWith(expect.objectContaining({ muscleGroup: 'chest' }));
      expect(buttonByText(fixture, /^\s*Pecho\s*$/)!.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('"En el día"', () => {
    it('los ejercicios que el día ya tiene muestran "En el día" y no se pueden elegir', async () => {
      const { fixture } = makeFixture({ day: makeDayView('Pierna B', ['ex-2']) });
      await flush(fixture);

      const [press, sentadilla] = rows(fixture);
      expect(sentadilla?.textContent).toContain('En el día');
      expect(sentadilla?.disabled).toBe(true);
      expect(sentadilla?.getAttribute('aria-label')).toBe('Sentadilla, en el día');
      expect(press?.textContent).not.toContain('En el día');
      expect(press?.disabled).toBe(false);
      expect(press?.getAttribute('aria-label')).toBe('Seleccionar Press de banca');
    });

    it('un ejercicio "En el día" no suma al contador ni viaja en el alta', async () => {
      const { fixture, addSpy } = makeFixture({ day: makeDayView('Pierna B', ['ex-2']) });
      await flush(fixture);

      fixture.componentInstance.toggleSelect('ex-2');
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedCount()).toBe(0);

      rows(fixture)[0]!.click();
      fixture.detectChanges();
      cta(fixture).click();
      await flush(fixture);

      expect(addSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseIds: ['ex-1'] });
    });
  });

  describe('multi-select (#4)', () => {
    it('clickear una fila la selecciona, marca aria-pressed y NO navega', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const first = rows(fixture)[0]!;
      first.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isSelected('ex-1')).toBe(true);
      expect(first.getAttribute('aria-pressed')).toBe('true');
      expect(first.getAttribute('aria-label')).toBe('Quitar Press de banca');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('clickear una fila seleccionada la deselecciona', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      rows(fixture)[0]!.click();
      fixture.detectChanges();
      rows(fixture)[0]!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount()).toBe(0);
      expect(rows(fixture)[0]!.getAttribute('aria-pressed')).toBe('false');
    });

    it('sin selección el botón dice "Elegí ejercicios" y está deshabilitado', async () => {
      const { fixture, addSpy } = makeFixture();
      await flush(fixture);

      const button = cta(fixture);
      expect(button.textContent?.trim()).toBe('Elegí ejercicios');
      expect(button.disabled).toBe(true);
      button.click();
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('el botón cuenta la selección: "Agregar 1 ejercicio" / "Agregar 2 ejercicios"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      rows(fixture)[0]!.click();
      fixture.detectChanges();
      expect(cta(fixture).textContent?.trim()).toBe('Agregar 1 ejercicio');
      expect(cta(fixture).disabled).toBe(false);

      rows(fixture)[1]!.click();
      fixture.detectChanges();
      expect(cta(fixture).textContent?.trim()).toBe('Agregar 2 ejercicios');
    });

    it('seleccionar varios y confirmar llama AddExercisesToDayUseCase con los ids y vuelve al editor', async () => {
      const { fixture, addSpy, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      rows(fixture)[0]!.click();
      rows(fixture)[1]!.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedCount()).toBe(2);

      cta(fixture).click();
      await flush(fixture);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseIds: ['ex-1', 'ex-2'] });
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });

    it('la selección sobrevive a un cambio de filtro', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      rows(fixture)[0]!.click();
      fixture.componentInstance.toggleMuscleGroup('legs');
      await flush(fixture);

      expect(fixture.componentInstance.selectedCount()).toBe(1);
      expect(cta(fixture).textContent?.trim()).toBe('Agregar 1 ejercicio');
    });
  });

  describe('crear ejercicio propio', () => {
    it('el "+" del encabezado se llama "Crear ejercicio propio"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      expect(buttonByLabel(fixture, 'Crear ejercicio propio')).toBeTruthy();
    });

    it('navega a /exercises/new con returnRoutineId y returnDayId', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      buttonByLabel(fixture, 'Crear ejercicio propio')!.click();
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
      expect(cta(fixture).textContent?.trim()).toBe('Agregar 1 ejercicio');
      expect(getExercisesSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
