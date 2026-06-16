import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { FgWheelPickerComponent, WHEEL_ITEM_HEIGHT } from './wheel-picker.component';

describe('FgWheelPickerComponent', () => {
  let fixture: ComponentFixture<FgWheelPickerComponent>;
  let component: FgWheelPickerComponent;

  function create(inputs: { min?: number; max?: number; step?: number; ariaLabel?: string } = {}): void {
    fixture = TestBed.createComponent(FgWheelPickerComponent);
    component = fixture.componentInstance;
    if (inputs.min !== undefined) fixture.componentRef.setInput('min', inputs.min);
    if (inputs.max !== undefined) fixture.componentRef.setInput('max', inputs.max);
    if (inputs.step !== undefined) fixture.componentRef.setInput('step', inputs.step);
    if (inputs.ariaLabel !== undefined) fixture.componentRef.setInput('ariaLabel', inputs.ariaLabel);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgWheelPickerComponent],
    }).compileComponents();
  });

  // ── options generation ─────────────────────────────────────────────────────

  it('genera opciones de min a max con el step', () => {
    create({ min: 1, max: 5, step: 1 });
    expect(component.options()).toEqual([1, 2, 3, 4, 5]);
  });

  it('respeta el step > 1', () => {
    create({ min: 0, max: 10, step: 5 });
    expect(component.options()).toEqual([0, 5, 10]);
  });

  it('renderiza un item por opción', () => {
    create({ min: 1, max: 50, step: 1 });
    const items = fixture.debugElement.queryAll(By.css('[data-testid="wheel-item"]'));
    expect(items).toHaveLength(50);
  });

  it('expone el aria-label en el contenedor scrolleable', () => {
    create({ ariaLabel: 'Repeticiones' });
    const scroller = fixture.debugElement.query(By.css('[role="listbox"]'));
    expect((scroller.nativeElement as HTMLElement).getAttribute('aria-label')).toBe('Repeticiones');
  });

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  it('writeValue setea el valor sin emitir onChange', () => {
    create({ min: 1, max: 50 });
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.writeValue(12);

    expect(component.value()).toBe(12);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marca el item seleccionado como aria-selected', () => {
    create({ min: 1, max: 10 });
    component.writeValue(7);
    fixture.detectChanges();

    const selected = fixture.debugElement.query(By.css('[aria-selected="true"]'));
    expect((selected.nativeElement as HTMLElement).textContent?.trim()).toBe('7');
  });

  it('select(valor) emite onChange con el valor elegido', () => {
    create({ min: 1, max: 50 });
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.select(9);

    expect(component.value()).toBe(9);
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('select es idempotente: no re-emite si el valor no cambió', () => {
    create({ min: 1, max: 50 });
    component.writeValue(9);
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.select(9);

    expect(onChange).not.toHaveBeenCalled();
  });

  // ── scroll → valor ─────────────────────────────────────────────────────────

  it('onScroll mapea el offset al índice centrado y selecciona', () => {
    create({ min: 1, max: 50, step: 1 });
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    // índice 3 (valor 4) centrado
    component.onScroll(3 * WHEEL_ITEM_HEIGHT);

    expect(component.value()).toBe(4);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('onScroll redondea al item más cercano', () => {
    create({ min: 1, max: 50, step: 1 });
    // un poco más de la mitad entre índice 2 y 3 → redondea a 3 (valor 4)
    component.onScroll(2 * WHEEL_ITEM_HEIGHT + WHEEL_ITEM_HEIGHT * 0.6);
    expect(component.value()).toBe(4);
  });

  it('onScroll clampea el offset fuera de rango al último item', () => {
    create({ min: 1, max: 5, step: 1 });
    component.onScroll(9999);
    expect(component.value()).toBe(5);
  });

  // ── integración con Reactive Forms (formControlName via CVA) ────────────────

  it('integra con un FormControl: setValue refleja en el wheel, scroll actualiza el control', () => {
    @Component({
      standalone: true,
      imports: [FgWheelPickerComponent, ReactiveFormsModule],
      template: `<fg-wheel-picker [formControl]="ctrl" [min]="1" [max]="50" />`,
    })
    class HostComponent {
      readonly ctrl = new FormControl(8);
    }

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    const wheel = hostFixture.debugElement.query(By.directive(FgWheelPickerComponent))
      .componentInstance as FgWheelPickerComponent;

    // form → wheel
    expect(wheel.value()).toBe(8);

    // wheel → form
    wheel.onScroll(9 * WHEEL_ITEM_HEIGHT); // valor 10
    expect(hostFixture.componentInstance.ctrl.value).toBe(10);
  });
});
