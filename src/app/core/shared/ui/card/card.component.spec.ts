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
    it('raised=true (default) aplica clase de ring/shadow inset', () => {
      create();
      const className = (fixture.nativeElement as HTMLElement).className;
      // El shadow-[inset...] usa ring via shadow o clase shadow-[inset...]
      // El design usa shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]
      // Verificamos alguna de las posibles representaciones
      expect(className).toMatch(/ring-1|shadow-\[inset/);
    });

    it('raised=false no aplica clase de ring/shadow inset', () => {
      create({ raised: false });
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).not.toMatch(/ring-1|shadow-\[inset/);
    });
  });

  describe('host classes base', () => {
    it('aplica bg-forge-900 y rounded-lg en el host', () => {
      create();
      const className = (fixture.nativeElement as HTMLElement).className;
      expect(className).toContain('bg-forge-900');
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
