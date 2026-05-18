import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FgInputComponent } from './input.component';

// Helper host component for CVA testing
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FgInputComponent],
  template: `<fg-input [formControl]="ctrl" [label]="label" [helper]="helper" [error]="error"
    [prefix]="prefix" [suffix]="suffix" [tabularNums]="tabularNums" [size]="size" />`,
})
class HostComponent {
  ctrl = new FormControl('');
  label: string | undefined = undefined;
  helper: string | undefined = undefined;
  error: string | undefined = undefined;
  prefix: string | undefined = undefined;
  suffix: string | undefined = undefined;
  tabularNums = false;
  size: 'sm' | 'md' | 'lg' = 'md';
}

describe('FgInputComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function setup(overrides: Partial<HostComponent> = {}): void {
    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    Object.assign(host, overrides);
    hostFixture.detectChanges();
  }

  function getInput(): HTMLInputElement {
    return (hostFixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
  }

  function getFgInput(): FgInputComponent {
    return hostFixture.debugElement.query(By.directive(FgInputComponent)).componentInstance as FgInputComponent;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('selector es fg-input y el componente se instancia', () => {
    setup();
    expect(getFgInput()).toBeTruthy();
  });

  describe('CVA — writeValue', () => {
    it('FormControl con valor inicial refleja en el input', () => {
      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      host.ctrl = new FormControl('hola');
      hostFixture.detectChanges();
      expect(getInput().value).toBe('hola');
    });

    it('ctrl.setValue actualiza el input', () => {
      setup();
      host.ctrl.setValue('nuevo');
      hostFixture.detectChanges();
      expect(getInput().value).toBe('nuevo');
    });
  });

  describe('CVA — registerOnChange', () => {
    it('typing en el input actualiza ctrl.value', () => {
      setup();
      const input = getInput();
      input.value = 'bar';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      hostFixture.detectChanges();
      expect(host.ctrl.value).toBe('bar');
    });
  });

  describe('CVA — registerOnTouched', () => {
    it('blur en el input marca ctrl como touched', () => {
      setup();
      expect(host.ctrl.touched).toBe(false);
      getInput().dispatchEvent(new Event('blur', { bubbles: true }));
      hostFixture.detectChanges();
      expect(host.ctrl.touched).toBe(true);
    });
  });

  describe('CVA — setDisabledState', () => {
    it('ctrl.disable() deshabilita el input nativo', () => {
      setup();
      host.ctrl.disable();
      hostFixture.detectChanges();
      expect(getInput().disabled).toBe(true);
    });

    it('ctrl.enable() vuelve a habilitar el input', () => {
      setup();
      host.ctrl.disable();
      hostFixture.detectChanges();
      host.ctrl.enable();
      hostFixture.detectChanges();
      expect(getInput().disabled).toBe(false);
    });
  });

  describe('error input', () => {
    it('error set → span con texto destructivo aparece', () => {
      setup({ error: 'Campo requerido' });
      const root = hostFixture.nativeElement as HTMLElement;
      const errorSpan = root.querySelector<HTMLSpanElement>('.text-destructive-500');
      expect(errorSpan).toBeTruthy();
      expect(errorSpan!.textContent).toContain('Campo requerido');
    });

    it('sin error y con helper → helper visible', () => {
      setup({ helper: 'Ingresá tu peso' });
      expect((hostFixture.nativeElement as HTMLElement).textContent).toContain('Ingresá tu peso');
    });

    it('con error y helper → solo error visible, helper oculto', () => {
      setup({ error: 'Error', helper: 'Helper' });
      const root = hostFixture.nativeElement as HTMLElement;
      const errorSpan = root.querySelector<HTMLSpanElement>('.text-destructive-500');
      expect(errorSpan).toBeTruthy();
      expect(root.textContent).not.toContain('Helper');
    });
  });

  describe('prefix / suffix', () => {
    it('prefix se renderiza a la izquierda del input', () => {
      setup({ prefix: 'kg' });
      expect((hostFixture.nativeElement as HTMLElement).textContent).toContain('kg');
    });

    it('suffix se renderiza a la derecha del input', () => {
      setup({ suffix: 'reps' });
      expect((hostFixture.nativeElement as HTMLElement).textContent).toContain('reps');
    });
  });

  describe('tabularNums', () => {
    it('tabularNums=true aplica clase tabular-nums al input interno', () => {
      setup({ tabularNums: true });
      expect(getInput().className).toContain('tabular-nums');
    });

    it('tabularNums=false (default) no aplica tabular-nums', () => {
      setup({ tabularNums: false });
      expect(getInput().className).not.toContain('tabular-nums');
    });
  });

  describe('size input', () => {
    it('size=sm aplica h-9 al field wrapper', () => {
      setup({ size: 'sm' });
      const wrapper = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.flex.items-center.rounded-md');
      expect(wrapper?.className).toContain('h-9');
    });

    it('size=md (default) aplica h-11 al field wrapper', () => {
      setup({ size: 'md' });
      const wrapper = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.flex.items-center.rounded-md');
      expect(wrapper?.className).toContain('h-11');
    });

    it('size=lg aplica h-14 al field wrapper', () => {
      setup({ size: 'lg' });
      const wrapper = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.flex.items-center.rounded-md');
      expect(wrapper?.className).toContain('h-14');
    });
  });

  describe('label input', () => {
    it('label se renderiza en el DOM', () => {
      setup({ label: 'Peso corporal' });
      expect((hostFixture.nativeElement as HTMLElement).textContent).toContain('Peso corporal');
    });
  });
});
