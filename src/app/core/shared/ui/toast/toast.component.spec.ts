import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FgToastComponent } from './toast.component';

describe('FgToastComponent', () => {
  let fixture: ComponentFixture<FgToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgToastComponent],
    }).compileComponents();
  });

  function create(inputs: {
    kind?: 'info' | 'success' | 'error';
    title?: string;
    body?: string;
    action?: { label: string; handler: () => void };
  } = {}): void {
    fixture = TestBed.createComponent(FgToastComponent);
    fixture.componentRef.setInput('title', inputs.title ?? 'Test title');
    if (inputs.kind !== undefined) fixture.componentRef.setInput('kind', inputs.kind);
    if (inputs.body !== undefined) fixture.componentRef.setInput('body', inputs.body);
    if (inputs.action !== undefined) fixture.componentRef.setInput('action', inputs.action);
    fixture.detectChanges();
  }

  it('selector es fg-toast y el componente se instancia', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('kind=info', () => {
    it('renderiza fg-icon con name="info"', () => {
      create({ kind: 'info' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect(mainIcon).toBeTruthy();
      expect((mainIcon.componentInstance as { name: () => string }).name()).toBe('info');
    });

    it('aplica tint text-forge-300 al icono principal', () => {
      create({ kind: 'info' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect((mainIcon.nativeElement as HTMLElement).className).toContain('text-forge-300');
    });
  });

  describe('kind=success', () => {
    it('renderiza fg-icon con name="check-circle"', () => {
      create({ kind: 'success' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect((mainIcon.componentInstance as { name: () => string }).name()).toBe('check-circle');
    });

    it('aplica tint accent al icono principal', () => {
      create({ kind: 'success' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect((mainIcon.nativeElement as HTMLElement).className).toMatch(/accent/);
    });
  });

  describe('kind=error', () => {
    it('renderiza fg-icon con name="info"', () => {
      create({ kind: 'error' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect((mainIcon.componentInstance as { name: () => string }).name()).toBe('info');
    });

    it('aplica tint destructive al icono principal', () => {
      create({ kind: 'error' });
      const mainIcon = fixture.debugElement.queryAll(By.css('fg-icon'))[0]!;
      expect((mainIcon.nativeElement as HTMLElement).className).toMatch(/destructive/);
    });
  });

  describe('title (required)', () => {
    it('renderiza el title en el DOM', () => {
      create({ title: 'Guardado correctamente' });
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Guardado correctamente');
    });
  });

  describe('body (optional)', () => {
    it('renderiza el body cuando se pasa', () => {
      create({ body: 'Set guardado' });
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Set guardado');
    });

    it('no renderiza el body cuando no se pasa', () => {
      create({ title: 'Solo título' });
      // The title is always there, but no extra "body" div should exist
      // We verify by checking there's no second content block beyond the title
      const bodyDiv = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="body"]');
      expect(bodyDiv).toBeNull();
    });
  });

  describe('action (optional)', () => {
    it('renderiza el botón de acción con el label cuando se pasa action', () => {
      create({ action: { label: 'Actualizar', handler: jest.fn() } });
      const actionBtn = fixture.debugElement.query(By.css('button[data-testid="action"]'));
      expect(actionBtn).toBeTruthy();
      expect((actionBtn.nativeElement as HTMLButtonElement).textContent).toContain('Actualizar');
    });

    it('no renderiza el botón de acción cuando no se pasa action', () => {
      create();
      const actionBtn = fixture.debugElement.query(By.css('button[data-testid="action"]'));
      expect(actionBtn).toBeNull();
    });

    it('emite actionClick al hacer click en el botón de acción', () => {
      create({ action: { label: 'Actualizar', handler: jest.fn() } });
      let emitted = false;
      fixture.componentInstance.actionClick.subscribe(() => { emitted = true; });
      const actionBtn = fixture.debugElement.query(By.css('button[data-testid="action"]'));
      (actionBtn.nativeElement as HTMLButtonElement).click();
      expect(emitted).toBe(true);
    });
  });

  describe('dismiss output', () => {
    it('emite dismiss al hacer click en el botón X', () => {
      create();
      let emitted = false;
      fixture.componentInstance.dismiss.subscribe(() => { emitted = true; });
      const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Cerrar"]'));
      expect(closeBtn).toBeTruthy();
      (closeBtn.nativeElement as HTMLButtonElement).click();
      expect(emitted).toBe(true);
    });

    it('botón X tiene aria-label="Cerrar"', () => {
      create();
      const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Cerrar"]'));
      expect(closeBtn).toBeTruthy();
    });
  });
});
