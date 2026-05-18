import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FgChipComponent } from './chip.component';

describe('FgChipComponent', () => {
  let fixture: ComponentFixture<FgChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgChipComponent],
    }).compileComponents();
  });

  function create(inputs: { active?: boolean; size?: 'sm' | 'md'; leadingIcon?: string } = {}): void {
    fixture = TestBed.createComponent(FgChipComponent);
    if (inputs.active !== undefined) fixture.componentRef.setInput('active', inputs.active);
    if (inputs.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
    if (inputs.leadingIcon !== undefined) fixture.componentRef.setInput('leadingIcon', inputs.leadingIcon);
    fixture.detectChanges();
  }

  it('selector es fg-chip y el componente se instancia', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('active input', () => {
    it('active=false (default) aplica clases neutrales con bg-forge-850', () => {
      create({ active: false });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('bg-forge-850');
    });

    it('active=true aplica clases accent con rgba', () => {
      create({ active: true });
      const className = (fixture.nativeElement as HTMLElement).className;
      // Verifica algún indicador de accent activo
      expect(className).toMatch(/accent|rgba.*accent/i);
    });
  });

  describe('size input', () => {
    it('size=sm aplica h-6', () => {
      create({ size: 'sm' });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('h-6');
    });

    it('size=md (default) aplica h-7', () => {
      create({ size: 'md' });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('h-7');
    });
  });

  describe('tap output', () => {
    it('emite tap al hacer click', () => {
      create();
      let emitted = false;
      fixture.componentInstance.tap.subscribe(() => { emitted = true; });
      (fixture.nativeElement as HTMLElement).click();
      expect(emitted).toBe(true);
    });

    it('emite tap al presionar Enter', () => {
      create();
      let emitted = false;
      fixture.componentInstance.tap.subscribe(() => { emitted = true; });
      const el = fixture.nativeElement as HTMLElement;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      expect(emitted).toBe(true);
    });
  });

  describe('leadingIcon', () => {
    it('renderiza fg-icon cuando se pasa leadingIcon', () => {
      create({ leadingIcon: 'dumbbell' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeTruthy();
    });

    it('fg-icon tiene el name correcto y size 12', () => {
      create({ leadingIcon: 'dumbbell' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect((icon.componentInstance as { name: () => string }).name()).toBe('dumbbell');
      expect((icon.componentInstance as { size: () => number }).size()).toBe(12);
    });

    it('no renderiza fg-icon cuando leadingIcon no se pasa', () => {
      create();
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeNull();
    });
  });

  describe('content projection', () => {
    it('proyecta texto via ng-content', async () => {
      @Component({
        standalone: true,
        imports: [FgChipComponent],
        template: `<fg-chip><span class="chip-label">3/5</span></fg-chip>`,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const label = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLSpanElement>('.chip-label');
      expect(label).toBeTruthy();
      expect(label!.textContent).toBe('3/5');
    });
  });
});
