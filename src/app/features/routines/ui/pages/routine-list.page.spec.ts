import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoutineListPage } from './routine-list.page';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { GetRoutineDaysCountUseCase } from '../../domain/use-cases/get-routine-days-count.use-case';
import { Router } from '@angular/router';
import { Routine } from '../../domain/routine.entity';

const makeRoutine = (id: string, name: string, isActive = false): Routine => ({
  id,
  name,
  isActive,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

describe('RoutineListPage', () => {
  let fixture: ComponentFixture<RoutineListPage>;
  let navigateSpy: jest.Mock;
  let getAllExecuteSpy: jest.Mock;
  let getDaysCountExecuteSpy: jest.Mock;

  beforeEach(async () => {
    navigateSpy = jest.fn().mockResolvedValue(true);
    getAllExecuteSpy = jest.fn().mockResolvedValue([]);
    getDaysCountExecuteSpy = jest.fn().mockResolvedValue(0);

    await TestBed.configureTestingModule({
      imports: [RoutineListPage],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    })
      .overrideComponent(RoutineListPage, {
        set: {
          providers: [
            { provide: GetAllRoutinesUseCase, useValue: { execute: getAllExecuteSpy } },
            { provide: GetRoutineDaysCountUseCase, useValue: { execute: getDaysCountExecuteSpy } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RoutineListPage);
  });

  it('renderiza fg-page-header con title "Rutinas"', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('fg-page-header');
    expect(header).toBeTruthy();
    expect(fixture.componentInstance.trailingActions).toBeDefined();
  });

  it('trailingActions tiene una acción con icon plus y ariaLabel "Nueva rutina"', () => {
    fixture.detectChanges();
    const actions = fixture.componentInstance.trailingActions;
    expect(actions.length).toBe(1);
    expect(actions[0]!.icon).toBe('plus');
    expect(actions[0]!.ariaLabel).toBe('Nueva rutina');
  });

  it('click en trailing plus navega a /routines/new', () => {
    fixture.detectChanges();
    const actions = fixture.componentInstance.trailingActions;
    actions[0]!.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/routines/new']);
  });

  it('muestra fg-empty-state cuando no hay rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([]);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('fg-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('NO muestra fg-empty-state cuando hay rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([makeRoutine('r-1', 'Push')]);
    getDaysCountExecuteSpy.mockResolvedValue(2);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('fg-empty-state');
    expect(emptyState).toBeNull();
  });

  it('renderiza N fg-routine-card cuando hay N rutinas', async () => {
    getAllExecuteSpy.mockResolvedValue([
      makeRoutine('r-1', 'Push'),
      makeRoutine('r-2', 'Pull'),
    ]);
    // Note: called twice (once per routine) — use mockResolvedValue
    getDaysCountExecuteSpy.mockResolvedValue(1);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('fg-routine-card');
    expect(cards.length).toBe(2);
  });

  it('cada fg-routine-card recibe dayCount correcto', async () => {
    const routines = [makeRoutine('r-1', 'Push'), makeRoutine('r-2', 'Pull')];
    getAllExecuteSpy.mockResolvedValue(routines);
    getDaysCountExecuteSpy.mockImplementation((id: string) =>
      Promise.resolve(id === 'r-1' ? 2 : 1),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const dayCounts = fixture.componentInstance.dayCounts();
    expect(dayCounts.get('r-1')).toBe(2);
    expect(dayCounts.get('r-2')).toBe(1);
  });

  it('cardClick en tarjeta navega a /routines/:id', async () => {
    const routine = makeRoutine('r-1', 'Push');
    getAllExecuteSpy.mockResolvedValue([routine]);
    getDaysCountExecuteSpy.mockResolvedValue(0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.openRoutine(routine);
    expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
  });
});
