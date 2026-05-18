import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FgEmptyStateComponent } from './empty-state.component';

describe('FgEmptyStateComponent', () => {
  let fixture: ComponentFixture<FgEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgEmptyStateComponent],
    }).compileComponents();
  });

  function create(inputs: { icon?: string; title: string; body?: string }): void {
    fixture = TestBed.createComponent(FgEmptyStateComponent);
    if (inputs.icon !== undefined) fixture.componentRef.setInput('icon', inputs.icon);
    fixture.componentRef.setInput('title', inputs.title);
    if (inputs.body !== undefined) fixture.componentRef.setInput('body', inputs.body);
    fixture.detectChanges();
  }

  it('selector es fg-empty-state y el componente se instancia', () => {
    create({ title: 'Test' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('icon input', () => {
    it('icon default es dumbbell — renderiza fg-icon con name=dumbbell', () => {
      create({ title: 'Sin rutinas' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeTruthy();
      expect((icon.componentInstance as { name: () => string }).name()).toBe('dumbbell');
    });

    it('icon=star renderiza fg-icon con name=star', () => {
      create({ title: 'Test', icon: 'star' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect(icon).toBeTruthy();
      expect((icon.componentInstance as { name: () => string }).name()).toBe('star');
    });

    it('fg-icon tiene size 24', () => {
      create({ title: 'Test' });
      const icon = fixture.debugElement.query(By.css('fg-icon'));
      expect((icon.componentInstance as { size: () => number }).size()).toBe(24);
    });
  });

  describe('title input (required)', () => {
    it('renderiza el título en el DOM', () => {
      create({ title: 'No hay rutinas' });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('No hay rutinas');
    });
  });

  describe('body input (opcional)', () => {
    it('renderiza el body cuando se provee', () => {
      create({ title: 'Empty', body: 'Agregá una rutina' });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Agregá una rutina');
    });

    it('no renderiza el body cuando no se provee', () => {
      create({ title: 'Empty' });
      // body container should not exist
      const bodyEl = fixture.debugElement.query(By.css('.t-body-sm'));
      expect(bodyEl).toBeNull();
    });
  });

  describe('action slot (ng-content select=[fgEmptyAction])', () => {
    it('proyecta el contenido con atributo fgEmptyAction', async () => {
      @Component({
        standalone: true,
        imports: [FgEmptyStateComponent],
        template: `
          <fg-empty-state title="Sin datos">
            <button fgEmptyAction id="action-btn">Agregar</button>
          </fg-empty-state>
        `,
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      const btn = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#action-btn');
      expect(btn).toBeTruthy();
      expect(btn!.textContent).toBe('Agregar');
    });
  });
});
