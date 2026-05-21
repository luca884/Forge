import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FgButtonComponent } from './button.component';

describe('FgButtonComponent', () => {
  let fixture: ComponentFixture<FgButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgButtonComponent],
    }).compileComponents();
  });

  function create(inputs: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent_soft';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    full?: boolean;
    leadingIcon?: string;
    trailingIcon?: string;
  } = {}): void {
    fixture = TestBed.createComponent(FgButtonComponent);
    if (inputs.variant !== undefined) fixture.componentRef.setInput('variant', inputs.variant);
    if (inputs.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
    if (inputs.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
    if (inputs.full !== undefined) fixture.componentRef.setInput('full', inputs.full);
    if (inputs.leadingIcon !== undefined) fixture.componentRef.setInput('leadingIcon', inputs.leadingIcon);
    if (inputs.trailingIcon !== undefined) fixture.componentRef.setInput('trailingIcon', inputs.trailingIcon);
    fixture.detectChanges();
  }

  it('el componente se instancia con selector button[fg-button]', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('variant input', () => {
    it('variant=primary (default) aplica bg-accent-700', () => {
      create({ variant: 'primary' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('bg-accent-700');
    });

    it('variant=secondary aplica bg-forge-850', () => {
      create({ variant: 'secondary' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('bg-forge-850');
    });

    it('variant=ghost aplica bg-transparent', () => {
      create({ variant: 'ghost' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('bg-transparent');
    });

    it('variant=destructive aplica clases destructive', () => {
      create({ variant: 'destructive' });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toMatch(/destructive/);
    });

    it('variant=accent_soft aplica clases accent_soft', () => {
      create({ variant: 'accent_soft' });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toMatch(/accent/);
    });
  });

  describe('size input', () => {
    it('size=sm aplica h-9', () => {
      create({ size: 'sm' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('h-9');
    });

    it('size=md (default) aplica h-11', () => {
      create({ size: 'md' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('h-11');
    });

    it('size=lg aplica h-14', () => {
      create({ size: 'lg' });
      expect((fixture.nativeElement as HTMLElement).className).toContain('h-14');
    });
  });

  describe('disabled input', () => {
    it('disabled=true aplica opacity-45 y pointer-events-none', () => {
      create({ disabled: true });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('opacity-45');
      expect(className).toContain('pointer-events-none');
    });

    it('disabled=true agrega atributo disabled al elemento nativo', () => {
      create({ disabled: true });
      expect((fixture.nativeElement as HTMLButtonElement).disabled).toBe(true);
    });

    it('disabled=false (default) aplica cursor-pointer', () => {
      create({ disabled: false });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('cursor-pointer');
    });
  });

  describe('full input', () => {
    it('full=true aplica w-full', () => {
      create({ full: true });
      expect((fixture.nativeElement as HTMLElement).className).toContain('w-full');
    });

    it('full=false (default) no aplica w-full', () => {
      create({ full: false });
      expect((fixture.nativeElement as HTMLElement).className).not.toContain('w-full');
    });
  });

  describe('leadingIcon', () => {
    it('renderiza fg-icon cuando se pasa leadingIcon', () => {
      create({ leadingIcon: 'check' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeTruthy();
    });

    it('fg-icon del leadingIcon tiene el name correcto', () => {
      create({ leadingIcon: 'check' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect((icon.componentInstance as { name: () => string }).name()).toBe('check');
    });

    it('iconSize es 16 para size=md', () => {
      create({ leadingIcon: 'check', size: 'md' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect((icon.componentInstance as { size: () => number }).size()).toBe(16);
    });

    it('iconSize es 20 para size=lg', () => {
      create({ leadingIcon: 'check', size: 'lg' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect((icon.componentInstance as { size: () => number }).size()).toBe(20);
    });

    it('no renderiza fg-icon cuando no se pasa leadingIcon', () => {
      create();
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeNull();
    });
  });

  describe('trailingIcon', () => {
    it('renderiza fg-icon cuando se pasa trailingIcon', () => {
      create({ trailingIcon: 'arrow-right' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeTruthy();
      expect((icon.componentInstance as { name: () => string }).name()).toBe('arrow-right');
    });
  });

  describe('content projection', () => {
    it('proyecta texto via ng-content', async () => {
      @Component({
        standalone: true,
        imports: [FgButtonComponent],
        template: `<button fg-button><span class="btn-label">Guardar</span></button>`,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const label = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLSpanElement>('.btn-label');
      expect(label).toBeTruthy();
      expect(label!.textContent).toBe('Guardar');
    });
  });

  describe('custom class coexistence (R13)', () => {
    it('clase custom del consumer coexiste con hostClasses', async () => {
      @Component({
        standalone: true,
        imports: [FgButtonComponent],
        template: `<button fg-button class="custom-extra">Label</button>`,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const btn = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;
      expect(btn.className).toContain('custom-extra');
      expect(btn.className).toContain('bg-accent-700');
    });
  });

  describe('anchor selector (a[fg-button]) — CTAs de navegacion', () => {
    it('un <a fg-button> recibe las hostClasses del componente', () => {
      @Component({
        standalone: true,
        imports: [FgButtonComponent],
        template: `<a fg-button variant="primary">Link CTA</a>`,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const anchor = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a')!;
      expect(anchor.className).toContain('bg-accent-700');
      expect(anchor.className).toContain('rounded-md');
    });
  });
});
