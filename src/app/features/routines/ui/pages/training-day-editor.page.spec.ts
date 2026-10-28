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
import { SetTargetSetsUseCase } from '../../domain/use-cases/set-target-sets.use-case';
import { SetRestSecondsUseCase } from '../../domain/use-cases/set-rest-seconds.use-case';
import { TargetSet } from '../../domain/target-set';
import { RoutineRepository } from '../../domain/routine.repository';
import { Routine } from '../../domain/routine.entity';
import { RestPreferencesService } from '@core/rest-preferences/rest-preferences.service';
import { TrackingType } from '@core/shared/domain/tracking-type';

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

// Series como las deja el editor: vaciar un campo guarda `undefined` y "Agregar serie" guarda 0,
// aunque el tipo diga `number`. Por eso los valores entran como `unknown`.
const looseSet = (set: Record<string, unknown>): TargetSet => set as unknown as TargetSet;
const repsSet = (reps: unknown): TargetSet => looseSet({ type: 'weight-reps', reps });
const timeSet = (durationSec: unknown): TargetSet => looseSet({ type: 'time', durationSec });
const distanceSet = (distanceKm: unknown): TargetSet =>
  looseSet({ type: 'distance-time', distanceKm, durationSec: 600 });

// ---- flush helper (slice F pattern) ----

async function flush(fixture: ComponentFixture<TrainingDayEditorPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function buttonByText(fixture: ComponentFixture<TrainingDayEditorPage>, text: string): HTMLButtonElement {
  const found = fixture.debugElement
    .queryAll(By.css('button'))
    .find((b) => ((b.nativeElement as HTMLElement).textContent ?? '').trim() === text);
  if (!found) throw new Error(`No button with text "${text}"`);
  return found.nativeElement as HTMLButtonElement;
}

const routine: Routine = {
  id: 'r-1',
  name: 'Torso / Pierna',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
  setTargetSetsSpy: jest.Mock;
  setRestSecondsSpy: jest.Mock;
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const getDayViewSpy = jest.fn().mockResolvedValue(
    opts.view !== undefined ? opts.view : makeView(),
  );
  const editSpy = jest.fn().mockResolvedValue(undefined);
  const removeSpy = jest.fn().mockResolvedValue(undefined);
  const setTargetSetsSpy = jest.fn().mockResolvedValue(undefined);
  const setRestSecondsSpy = jest.fn().mockResolvedValue(undefined);
  const routineRepo = { getById: jest.fn().mockResolvedValue(routine) };

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
      { provide: RoutineRepository, useValue: routineRepo },
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
          {
            provide: SetTargetSetsUseCase,
            useValue: { execute: setTargetSetsSpy },
          },
          {
            provide: SetRestSecondsUseCase,
            useValue: { execute: setRestSecondsSpy },
          },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(TrainingDayEditorPage);
  return { fixture, navigateSpy, getDayViewSpy, editSpy, removeSpy, setTargetSetsSpy, setRestSecondsSpy };
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

  describe('encabezado', () => {
    it('mantiene un h1 "Editar día" para lectores de pantalla', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const h1 = fixture.debugElement.query(By.css('h1'));
      expect((h1.nativeElement as HTMLElement).textContent?.trim()).toBe('Editar día');
    });

    it('el botón de volver muestra el nombre de la rutina y navega a /routines/:routineId', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1' });
      await flush(fixture);

      const back = fixture.debugElement.query(By.css('button[aria-label="Volver"]'));
      expect((back.nativeElement as HTMLElement).textContent).toContain('Torso / Pierna');
      (back.nativeElement as HTMLButtonElement).click();

      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
    });

    it('muestra el nombre del día en un campo editable con su etiqueta accesible', async () => {
      const { fixture } = makeFixture({ view: makeView({ name: 'Pierna B' }) });
      await flush(fixture);

      const input = fixture.debugElement.query(By.css('input[aria-label="Nombre del día"]'));
      expect((input.nativeElement as HTMLInputElement).value).toBe('Pierna B');
    });

    it('resume ejercicios y series del día', async () => {
      const set: TargetSet = { type: 'weight-reps', reps: 8, weightKg: 60 };
      const view = makeView({
        exercises: [
          { exerciseId: 'ex-1', exerciseName: 'Squat', order: 0, targetSets: [set, set, set], trackingType: 'weight-reps' },
          { exerciseId: 'ex-2', exerciseName: 'Row', order: 1, targetSets: [set], trackingType: 'weight-reps' },
        ],
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const meta = fixture.debugElement.query(By.css('[data-day-meta]'));
      expect((meta.nativeElement as HTMLElement).textContent?.trim()).toBe('2 ejercicios · 4 series');
    });

    it('resume en singular', async () => {
      const set: TargetSet = { type: 'weight-reps', reps: 8 };
      const view = makeView({
        exercises: [{ exerciseId: 'ex-1', exerciseName: 'Squat', order: 0, targetSets: [set], trackingType: 'weight-reps' }],
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const meta = fixture.debugElement.query(By.css('[data-day-meta]'));
      expect((meta.nativeElement as HTMLElement).textContent?.trim()).toBe('1 ejercicio · 1 serie');
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

    it('renders one fg-card holding the exercise table and no fg-empty-state when exercises exist', async () => {
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
    it('"Agregar ejercicios" button navigates to /routines/r-1/days/d-1/pick-exercise', async () => {
      const { fixture, navigateSpy } = makeFixture({ routineId: 'r-1', dayId: 'd-1' });
      await flush(fixture);

      const buttons = fixture.debugElement.queryAll(By.css('button[fg-button]'));
      const addBtn = buttons.find(b =>
        ((b.nativeElement as HTMLElement).textContent ?? '').trim() === 'Agregar ejercicios',
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

    it('"Listo" guarda y navega a /routines/:routineId', async () => {
      const view = makeView({ name: 'Día A' });
      const { fixture, navigateSpy, editSpy } = makeFixture({ routineId: 'r-1', view });
      await flush(fixture);

      fixture.componentInstance.form.patchValue({ name: 'Día A v2' });
      buttonByText(fixture, 'Listo').click();
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
      buttonByText(fixture, 'Listo').click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(editSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.submitAttempted()).toBe(true);
    });

    it('invalid form: muestra el error del nombre', async () => {
      const view = makeView({ name: 'Día A' });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      fixture.componentInstance.form.patchValue({ name: '' });
      buttonByText(fixture, 'Listo').click();
      await fixture.whenStable();
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('[data-name-error]'));
      expect((error.nativeElement as HTMLElement).textContent?.trim()).toBe('El nombre es obligatorio');
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

      fixture.componentInstance.toggleExpand('ex-1');
      fixture.detectChanges();

      const removeBtn = fixture.debugElement.query(
        By.css('button[aria-label="Quitar Squat"]'),
      );
      expect(removeBtn).toBeTruthy();
      expect((removeBtn.nativeElement as HTMLElement).textContent?.trim()).toBe('Quitar del día');
      (removeBtn.nativeElement as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(removeSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseId: 'ex-1' });
      expect(getDayViewSpy).toHaveBeenCalledTimes(2); // initial + reload
    });
  });

  describe('series objetivo (#3)', () => {
    const viewWithExercise = makeView({
      exercises: [
        {
          exerciseId: 'ex-1',
          order: 0,
          targetSets: [],
          exerciseName: 'Press de banca',
          trackingType: 'weight-reps',
        },
      ],
    });

    it('toggleExpand alterna el ejercicio expandido', async () => {
      const { fixture } = makeFixture({ view: viewWithExercise, dayId: 'd-1' });
      await flush(fixture);
      const c = fixture.componentInstance;

      expect(c.expandedExerciseId()).toBeNull();
      c.toggleExpand('ex-1');
      expect(c.expandedExerciseId()).toBe('ex-1');
      c.toggleExpand('ex-1');
      expect(c.expandedExerciseId()).toBeNull();
    });

    it('D4: un ejercicio en placas pide "Placas" al editar sus series objetivo', async () => {
      const platesView = makeView({
        exercises: [
          {
            exerciseId: 'ex-1',
            order: 0,
            targetSets: [{ type: 'weight-reps', reps: 10, weightKg: 6 }],
            exerciseName: 'Prensa',
            trackingType: 'weight-reps',
            weightUnit: 'plates',
          },
        ],
      });
      const { fixture } = makeFixture({ view: platesView, dayId: 'd-1' });
      await flush(fixture);

      fixture.componentInstance.toggleExpand('ex-1');
      fixture.detectChanges();

      const editor = (fixture.debugElement.query(By.css('fg-target-set-editor')).nativeElement as HTMLElement);
      const label = editor.querySelector('#set-0-weightKg')!.closest('label')!;
      expect(label.textContent).toContain('Placas');
      expect(editor.textContent).not.toContain('kg');
    });

    it('onTargetSetsChange persiste vía SetTargetSetsUseCase y recarga', async () => {
      const { fixture, setTargetSetsSpy, getDayViewSpy } = makeFixture({
        view: viewWithExercise,
        dayId: 'd-1',
      });
      await flush(fixture);
      const c = fixture.componentInstance;
      const ex = c.day()!.exercises[0]!;
      const sets: TargetSet[] = [{ type: 'weight-reps', reps: 8, weightKg: 60 }];

      await c.onTargetSetsChange(ex, sets);

      expect(setTargetSetsSpy).toHaveBeenCalledWith({
        dayId: 'd-1',
        exerciseId: 'ex-1',
        targetSets: sets,
      });
      expect(getDayViewSpy).toHaveBeenCalledTimes(2); // initial + reload
    });
  });

  describe('tabla de ejercicios', () => {
    const w = (reps: number): TargetSet => ({ type: 'weight-reps', reps, weightKg: 50 });
    const view = makeView({
      exercises: [
        { exerciseId: 'ex-1', exerciseName: 'Sentadilla', order: 0, targetSets: [w(6), w(7), w(8), w(8)], restSeconds: 180, trackingType: 'weight-reps' },
        { exerciseId: 'ex-2', exerciseName: 'Peso muerto', order: 1, targetSets: [w(5), w(5), w(5)], trackingType: 'weight-reps' },
        { exerciseId: 'ex-3', exerciseName: 'Plancha', order: 2, targetSets: [{ type: 'time', durationSec: 60 }, { type: 'time', durationSec: 60 }], trackingType: 'time' },
        { exerciseId: 'ex-4', exerciseName: 'Remo ergómetro', order: 3, targetSets: [], trackingType: 'distance-time' },
      ],
    });

    function rowText(fixture: ComponentFixture<TrainingDayEditorPage>, index: number): string {
      const rows = fixture.debugElement.queryAll(By.css('[data-exercise-row]'));
      return Array.from((rows[index]!.nativeElement as HTMLElement).querySelectorAll('[data-cell]'))
        .map((c) => {
          const parts = Array.from(c.children).map((child) => child.textContent?.trim() ?? '');
          return parts.length > 0 ? parts.join(' ') : (c.textContent?.trim() ?? '');
        })
        .join(' | ');
    }

    it('numera cada fila y resume el objetivo con rango de reps y el descanso propio', async () => {
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      expect(rowText(fixture, 0)).toBe('01 | Sentadilla desc. 3:00 | 4 × 6–8');
      expect(rowText(fixture, 1)).toBe('02 | Peso muerto | 3 × 5');
      expect(rowText(fixture, 2)).toBe('03 | Plancha | 2 × 60 s');
      expect(rowText(fixture, 3)).toBe('04 | Remo ergómetro | —');
    });

    it('la fila es un botón con aria-expanded que abre y cierra las series', async () => {
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const row = (): HTMLButtonElement =>
        fixture.debugElement.query(By.css('button[aria-label="Editar series de Sentadilla"]')).nativeElement as HTMLButtonElement;

      expect(row().getAttribute('aria-expanded')).toBe('false');
      expect(fixture.debugElement.query(By.css('fg-target-set-editor'))).toBeNull();

      row().click();
      fixture.detectChanges();
      expect(row().getAttribute('aria-expanded')).toBe('true');
      expect(fixture.debugElement.query(By.css('fg-target-set-editor'))).toBeTruthy();

      row().click();
      fixture.detectChanges();
      expect(row().getAttribute('aria-expanded')).toBe('false');
    });

    it('el descanso se edita en segundos y persiste con SetRestSecondsUseCase', async () => {
      const { fixture, setRestSecondsSpy } = makeFixture({ view, dayId: 'd-1' });
      await flush(fixture);

      fixture.componentInstance.toggleExpand('ex-1');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[aria-label="Descanso en segundos"]')).nativeElement as HTMLInputElement;
      expect(input.value).toBe('180');

      input.value = '120';
      input.dispatchEvent(new Event('change'));
      await fixture.whenStable();

      expect(setRestSecondsSpy).toHaveBeenCalledWith({ dayId: 'd-1', exerciseId: 'ex-1', restSeconds: 120 });
    });
  });

  describe('columna Objetivo con series vacías, inválidas, iguales y distintas', () => {
    interface TargetCase {
      readonly name: string;
      readonly trackingType: TrackingType;
      readonly sets: readonly TargetSet[];
      readonly expected: string;
    }

    /** Dibuja un ejercicio por caso y devuelve [caso, texto de su columna Objetivo]. */
    async function renderedTargets(cases: readonly TargetCase[]): Promise<string[][]> {
      const view = makeView({
        exercises: cases.map((c, i) => ({
          exerciseId: `ex-${i}`,
          exerciseName: `Ejercicio ${i}`,
          order: i,
          targetSets: [...c.sets],
          trackingType: c.trackingType,
        })),
      });
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      const rows = fixture.debugElement.queryAll(By.css('[data-exercise-row]'));
      return cases.map((c, i) => [
        c.name,
        (rows[i]!.nativeElement as HTMLElement).querySelectorAll('[data-cell]')[2]?.textContent?.trim() ?? '',
      ]);
    }

    it('B1: ignora los valores vacíos o inválidos y, si no queda ninguno, muestra "N series"', async () => {
      const cases: TargetCase[] = [
        { name: 'reps vacías', trackingType: 'weight-reps', sets: [repsSet(undefined), repsSet(undefined)], expected: '2 series' },
        { name: 'reps inválidas (NaN, negativa, 0)', trackingType: 'weight-reps', sets: [repsSet(NaN), repsSet(-3), repsSet(0)], expected: '3 series' },
        { name: 'una sola serie vacía', trackingType: 'weight-reps', sets: [repsSet(undefined)], expected: '1 serie' },
        { name: 'reps iguales y una vacía', trackingType: 'weight-reps', sets: [repsSet(undefined), repsSet(8), repsSet(8)], expected: '3 × 8' },
        { name: 'reps distintas y una inválida', trackingType: 'weight-reps', sets: [repsSet(NaN), repsSet(6), repsSet(8)], expected: '3 × 6–8' },
        { name: 'tiempo vacío', trackingType: 'time', sets: [timeSet(undefined), timeSet(undefined)], expected: '2 series' },
        { name: 'tiempo inválido (0, NaN)', trackingType: 'time', sets: [timeSet(0), timeSet(NaN)], expected: '2 series' },
        { name: 'tiempo igual y la primera vacía', trackingType: 'time', sets: [timeSet(undefined), timeSet(60), timeSet(60)], expected: '3 × 60 s' },
        { name: 'distancia vacía', trackingType: 'distance-time', sets: [distanceSet(undefined), distanceSet(undefined)], expected: '2 series' },
        { name: 'distancia inválida (negativa, infinita)', trackingType: 'distance-time', sets: [distanceSet(-1), distanceSet(Infinity)], expected: '2 series' },
        { name: 'distancia igual y la primera vacía', trackingType: 'distance-time', sets: [distanceSet(undefined), distanceSet(5), distanceSet(5)], expected: '3 × 5 km' },
      ];

      expect(await renderedTargets(cases)).toEqual(cases.map((c) => [c.name, c.expected]));
    });

    it('B2: en tiempo y distancia muestra el rango cuando las series difieren', async () => {
      const cases: TargetCase[] = [
        { name: 'tiempo igual', trackingType: 'time', sets: [timeSet(60), timeSet(60)], expected: '2 × 60 s' },
        { name: 'tiempo distinto, en desorden', trackingType: 'time', sets: [timeSet(60), timeSet(30), timeSet(45)], expected: '3 × 30–60 s' },
        { name: 'tiempo distinto y una vacía', trackingType: 'time', sets: [timeSet(undefined), timeSet(30), timeSet(60)], expected: '3 × 30–60 s' },
        { name: 'distancia igual', trackingType: 'distance-time', sets: [distanceSet(5), distanceSet(5)], expected: '2 × 5 km' },
        { name: 'distancia distinta, en desorden', trackingType: 'distance-time', sets: [distanceSet(5), distanceSet(2), distanceSet(3.5)], expected: '3 × 2–5 km' },
        { name: 'distancia distinta y una inválida', trackingType: 'distance-time', sets: [distanceSet(NaN), distanceSet(2), distanceSet(5)], expected: '3 × 2–5 km' },
      ];

      expect(await renderedTargets(cases)).toEqual(cases.map((c) => [c.name, c.expected]));
    });
  });

  describe('placeholder del descanso', () => {
    const view = makeView({
      exercises: [
        { exerciseId: 'ex-1', exerciseName: 'Sentadilla', order: 0, targetSets: [], trackingType: 'weight-reps' },
      ],
    });

    function restPlaceholder(fixture: ComponentFixture<TrainingDayEditorPage>): string {
      fixture.componentInstance.toggleExpand('ex-1');
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input[aria-label="Descanso en segundos"]'));
      return (input.nativeElement as HTMLInputElement).placeholder;
    }

    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it('sin descanso por defecto guardado sugiere 90 segundos, como antes', async () => {
      const { fixture } = makeFixture({ view });
      await flush(fixture);

      expect(restPlaceholder(fixture)).toBe('90');
    });

    it('B3: sugiere el "Descanso por defecto" de Perfil, en segundos', async () => {
      const { fixture } = makeFixture({ view });
      await flush(fixture);
      TestBed.inject(RestPreferencesService).setDefaultSeconds(150);

      expect(restPlaceholder(fixture)).toBe('150');
    });
  });
});
