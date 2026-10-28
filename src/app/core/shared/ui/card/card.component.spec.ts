import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FgCardComponent } from './card.component';

describe('FgCardComponent', () => {
  let fixture: ComponentFixture<FgCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgCardComponent],
    }).compileComponents();
  });

  function create(inputs: { padding?: number; raised?: boolean } = {}): void {
    fixture = TestBed.createComponent(FgCardComponent);
    if (inputs.padding !== undefined) fixture.componentRef.setInput('padding', inputs.padding);
    if (inputs.raised !== undefined) fixture.componentRef.setInput('raised', inputs.raised);
    fixture.detectChanges();
  }

  it('selector é fg-card e o componente se instancia', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('padding', () => {
    it('aplica padding 16px por defecto via style.padding.px', () => {
      create();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.padding).toBe('16px');
    });

    it('aplica padding 24px cuando se pasa padding=24', () => {
      create({ padding: 24 });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.padding).toBe('24px');
    });
  });

  describe('raised', () => {
    it('raised=true (default) aplica el borde de 1px border-line del lenguaje C', () => {
      create();
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('border-line');
      expect(className).not.toMatch(/shadow-/);
    });

    it('raised=false no aplica borde', () => {
      create({ raised: false });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).not.toContain('border-line');
    });
  });

  describe('host classes base', () => {
    it('aplica bg-surface y rounded-lg en el host', () => {
      create();
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('bg-surface');
      expect(className).toContain('rounded-lg');
    });
  });

  describe('content projection', () => {
    it('proyecta ng-content correctamente', async () => {
      @Component({
        standalone: true,
        imports: [FgCardComponent],
        template: `<fg-card><span id="inner">hello</span></fg-card>`,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const inner = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLSpanElement>('#inner');
      expect(inner).toBeTruthy();
      expect(inner!.textContent).toBe('hello');
    });
  });
});
