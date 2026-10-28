import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuscleGroup } from '../../domain/exercise.entity';
import { MuscleGroupFilterComponent } from './muscle-group-filter.component';

function setup(selected: MuscleGroup | undefined = undefined): {
  fixture: ComponentFixture<MuscleGroupFilterComponent>;
  picks: (MuscleGroup | undefined)[];
  buttons: () => HTMLButtonElement[];
} {
  const fixture = TestBed.createComponent(MuscleGroupFilterComponent);
  fixture.componentRef.setInput('selected', selected);
  const picks: (MuscleGroup | undefined)[] = [];
  fixture.componentInstance.pick.subscribe((g) => picks.push(g));
  fixture.detectChanges();
  const buttons = (): HTMLButtonElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  return { fixture, picks, buttons };
}

describe('MuscleGroupFilterComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [MuscleGroupFilterComponent] }));
  afterEach(() => TestBed.resetTestingModule());

  it('is a labelled group of native buttons: "Todos" + the 9 muscle groups', () => {
    const { fixture, buttons } = setup();
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Filtrar por grupo muscular');
    expect(buttons()).toHaveLength(10);
    expect(buttons().every((b) => b.type === 'button')).toBe(true);
    expect(buttons()[0]?.textContent?.trim()).toBe('Todos');
    expect(buttons()[1]?.textContent?.trim()).toBe('Pecho');
  });

  it('marks "Todos" as pressed when nothing is selected', () => {
    const { buttons } = setup();
    expect(buttons()[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[1]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks only the selected group as pressed', () => {
    const { buttons } = setup('back');
    const pressed = buttons().filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent?.trim()).toBe('Espalda');
  });

  it('paints the pressed button in solid accent and the rest on surface', () => {
    const { buttons } = setup('back');
    const on = buttons().find((b) => b.textContent?.trim() === 'Espalda');
    const off = buttons().find((b) => b.textContent?.trim() === 'Pecho');
    expect(on?.className).toContain('bg-accent');
    expect(on?.className).toContain('text-accent-on');
    expect(off?.className).toContain('bg-surface');
  });

  it('emits the group on click and undefined for "Todos"', () => {
    const { buttons, picks } = setup();
    buttons()[2]?.click();
    buttons()[0]?.click();
    expect(picks).toEqual(['back', undefined]);
  });

  it('is operable from the keyboard because every filter is a focusable <button>', () => {
    const { buttons } = setup();
    for (const b of buttons()) {
      expect(b.tabIndex).toBeGreaterThanOrEqual(0);
      expect(b.disabled).toBe(false);
    }
  });
});
