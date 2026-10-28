import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RoutineListPage } from './routine-list.page';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { GetRoutineDaysCountUseCase } from '../../domain/use-cases/get-routine-days-count.use-case';
import { Router } from '@angular/router';
import { Routine } from '../../domain/routine.entity';
import { TrainingDay } from '../../domain/training-day.entity';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { SetActiveRoutineUseCase } from '../../domain/use-cases/set-active-routine.use-case';

const makeRoutine = (id: string, name: string, isActive = false): Routine => ({
  id,
  name,
  isActive,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const makeDay = (id: string, routineId: string, name: string): TrainingDay => ({
  id,
  routineId,
  name,
  exercises: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

async function flush(fixture: ComponentFixture<RoutineListPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  // loadRoutines encadena varias esperas (rutinas, conteos, días de la activa).
  for (let i = 0; i < 10; i++) await Promise.resolve();
  fixture.detectChanges();
}

describe('RoutineListPage', () => {
  let fixture: ComponentFixture<RoutineListPage>;
  let navigateSpy: jest.Mock;
  let getAllExecuteSpy: jest.Mock;
  let getDaysCountExecuteSpy: jest.Mock;
  let getByRoutineIdSpy: jest.Mock;
  let setActiveSpy: jest.Mock;

  beforeEach(async () => {
    navigateSpy = jest.fn().mockResolvedValue(true);
    getAllExecuteSpy = jest.fn().mockResolvedValue([]);
    getDaysCountExecuteSpy = jest.fn().mockResolvedValue(0);
    getByRoutineIdSpy = jest.fn().mockResolvedValue([]);
    setActiveSpy = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [RoutineListPage],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: TrainingDayRepository, useValue: { getByRoutineId: getByRoutineIdSpy } },
      ],
    })
      .overrideComponent(RoutineListPage, {
        set: {
          providers: [
            { provide: GetAllRoutinesUseCase, useValue: { execute: getAllExecuteSpy } },
            { provide: GetRoutineDaysCountUseCase, useValue: { execute: getDaysCountExecuteSpy } },
            { provide: SetActiveRoutineUseCase, useValue: { execute: setActiveSpy } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RoutineListPage);
  });

  it('muestra el título "Rutinas" como h1', async () => {
    await flush(fixture);
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect((h1.nativeElement as HTMLElement).textContent?.trim()).toBe('Rutinas');
  });

  it('el botón "Nueva rutina" navega a /routines/new', async () => {
    await flush(fixture);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Nueva rutina"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    expect(navigateSpy).toHaveBeenCalledWith(['/routines/new']);
  });

  it('cuenta las rutinas en singular y plural', async () => {
    getAllExecuteSpy.mockResolvedValue([makeRoutine('r-1', 'Push', true)]);
    await flush(fixture);
    const count = () =>
      (fixture.debugElement.query(By.css('[data-routine-count]')).nativeElement as HTMLElement).textContent?.trim();
    expect(count()).toBe('1 rutina');

    const second = TestBed.createComponent(RoutineListPage);
    getAllExecuteSpy.mockResolvedValue([makeRoutine('r-1', 'Push', true), makeRoutine('r-2', 'Pull')]);
    await flush(second);
    expect(
      (second.debugElement.query(By.css('[data-routine-count]')).nativeElement as HTMLElement).textContent?.trim(),
    ).toBe('2 rutinas');
  });

  it('muestra fg-empty-state cuando no hay rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([]);
    await flush(fixture);
    const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
    expect(emptyState).toBeTruthy();
  });

  it('NO muestra fg-empty-state cuando hay rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([makeRoutine('r-1', 'Push')]);
    getDaysCountExecuteSpy.mockResolvedValue(2);
    await flush(fixture);
    const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
    expect(emptyState).toBeNull();
  });

  it('renderiza N fg-routine-card cuando hay N rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([
      makeRoutine('r-1', 'Push'),
      makeRoutine('r-2', 'Pull'),
    ]);
    // Note: called once per routine via Promise.all
    getDaysCountExecuteSpy.mockResolvedValue(1);
    await flush(fixture);
    const cards = fixture.debugElement.queryAll(By.css('fg-routine-card'));
    expect(cards.length).toBe(2);
  });

  it('cada fg-routine-card recibe dayCount correcto', async () => {
    const routines = [makeRoutine('r-1', 'Push'), makeRoutine('r-2', 'Pull')];
    getAllExecuteSpy.mockResolvedValue(routines);
    getDaysCountExecuteSpy.mockImplementation((id: string) =>
      Promise.resolve(id === 'r-1' ? 2 : 1),
    );
    await flush(fixture);
    const dayCounts = fixture.componentInstance.dayCounts();
    expect(dayCounts.get('r-1')).toBe(2);
    expect(dayCounts.get('r-2')).toBe(1);
  });

  it('cardClick en tarjeta navega a /routines/:id', async () => {
    const routine = makeRoutine('r-1', 'Push');
    getAllExecuteSpy.mockResolvedValue([routine]);
    getDaysCountExecuteSpy.mockResolvedValue(0);
    await flush(fixture);
    fixture.componentInstance.openRoutine(routine);
    expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
  });

  describe('rutina activa y otras rutinas', () => {
    const push = makeRoutine('r-1', 'Push', true);
    const pull = makeRoutine('r-2', 'Pull');

    beforeEach(() => {
      getAllExecuteSpy.mockResolvedValue([pull, push]);
      getDaysCountExecuteSpy.mockImplementation((id: string) => Promise.resolve(id === 'r-1' ? 2 : 1));
      getByRoutineIdSpy.mockResolvedValue([makeDay('d-1', 'r-1', 'Empuje A'), makeDay('d-2', 'r-1', 'Empuje B')]);
    });

    it('carga los días solo de la rutina activa y se los pasa a su tarjeta', async () => {
      await flush(fixture);
      expect(getByRoutineIdSpy).toHaveBeenCalledTimes(1);
      expect(getByRoutineIdSpy).toHaveBeenCalledWith('r-1');
      expect(fixture.componentInstance.activeDays().map((d) => d.id)).toEqual(['d-1', 'd-2']);
      expect(fixture.debugElement.queryAll(By.css('[data-day-row]'))).toHaveLength(2);
    });

    it('la activa va primero, en su sección, y las demás bajo "Otras rutinas"', async () => {
      await flush(fixture);
      const active = fixture.debugElement.query(By.css('[data-active-routine]'));
      expect((active.nativeElement as HTMLElement).textContent).toContain('Push');
      const others = fixture.debugElement.queryAll(By.css('[data-other-routines] fg-routine-card'));
      expect(others).toHaveLength(1);
      expect((others[0]!.nativeElement as HTMLElement).textContent).toContain('Pull');
    });

    it('sin rutina activa no hay sección de activa y todas van en "Otras rutinas"', async () => {
      getAllExecuteSpy.mockResolvedValue([makeRoutine('r-1', 'Push'), pull]);
      await flush(fixture);
      expect(fixture.debugElement.query(By.css('[data-active-routine]'))).toBeNull();
      expect(fixture.debugElement.queryAll(By.css('[data-other-routines] fg-routine-card'))).toHaveLength(2);
      expect(getByRoutineIdSpy).not.toHaveBeenCalled();
    });

    it('"Activar" activa la rutina con el caso de uso y recarga la lista', async () => {
      await flush(fixture);
      getAllExecuteSpy.mockResolvedValue([{ ...pull, isActive: true }, { ...push, isActive: false }]);
      const btn = fixture.debugElement.query(By.css('button[aria-label="Activar rutina Pull"]'));
      (btn.nativeElement as HTMLButtonElement).click();
      await flush(fixture);
      expect(setActiveSpy).toHaveBeenCalledWith('r-2');
      expect(getAllExecuteSpy).toHaveBeenCalledTimes(2);
      expect(fixture.componentInstance.routines().find((r) => r.id === 'r-2')?.isActive).toBe(true);
    });

    it('"Editar semana" navega al programa semanal de la rutina', async () => {
      await flush(fixture);
      const btn = fixture.debugElement
        .queryAll(By.css('button'))
        .find((b) => ((b.nativeElement as HTMLElement).textContent ?? '').includes('Editar semana'));
      (btn!.nativeElement as HTMLButtonElement).click();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'schedule']);
    });

    it('tocar un día abre su editor', async () => {
      await flush(fixture);
      const row = fixture.debugElement.query(By.css('button[aria-label="Editar día Empuje B"]'));
      (row.nativeElement as HTMLButtonElement).click();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-2']);
    });

    it('el enlace "Biblioteca de ejercicios" navega a /exercises', async () => {
      await flush(fixture);
      const btn = fixture.debugElement
        .queryAll(By.css('button'))
        .find((b) => ((b.nativeElement as HTMLElement).textContent ?? '').includes('Biblioteca de ejercicios'));
      (btn!.nativeElement as HTMLButtonElement).click();
      expect(navigateSpy).toHaveBeenCalledWith(['/exercises']);
    });
  });
});
